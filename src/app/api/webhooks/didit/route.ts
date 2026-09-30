import { NextRequest } from "next/server";
import crypto from "node:crypto";
import { db } from "../../../lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function shortenFloats(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(shortenFloats);
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>).map(([k, x]) => [
        k,
        shortenFloats(x),
      ])
    );
  }
  if (typeof v === "number" && !Number.isInteger(v) && v % 1 === 0) {
    return Math.trunc(v);
  }
  return v;
}

function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") {
    return Object.keys(v as object)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortKeys((v as Record<string, unknown>)[k]);
        return acc;
      }, {});
  }
  return v;
}

function cleanSecret(value?: string): string {
  if (!value) return "";
  const cleaned = value.replace(/\r/g, "").trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    return cleaned.slice(1, -1);
  }
  return cleaned;
}

type DiditWebhookPayload = {
  event_id?: unknown;
  status?: unknown;
  vendor_data?: unknown;
  decision?: unknown;
};

type AttemptDetails = {
  event_ids?: unknown;
  last_status?: string | null;
  last_event_id?: string | null;
  decision?: unknown;
  [key: string]: unknown;
};

export async function POST(request: NextRequest) {
  try {
    const raw = await request.text();

    const sig = request.headers.get("x-signature-v2") ?? "";
    const ts = Number(request.headers.get("x-timestamp"));

    const webhookSecret = cleanSecret(process.env.DIDIT_WEBHOOK_SECRET);

    if (!webhookSecret) {
      console.error("webhook didit: DIDIT_WEBHOOK_SECRET ausente");
      return new Response("config error", { status: 500 });
    }

    if (!ts || Math.abs(Date.now() / 1000 - ts) > 300) {
      return new Response("stale", { status: 401 });
    }

    let parsed: DiditWebhookPayload;
    try {
      parsed = JSON.parse(raw) as DiditWebhookPayload;
    } catch {
      return new Response("bad json", { status: 400 });
    }

    const canonical = JSON.stringify(sortKeys(shortenFloats(parsed)));

    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(canonical, "utf8")
      .digest("hex");

    if (
      sig.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
    ) {
      return new Response("bad sig", { status: 401 });
    }

    const driverId =
      parsed?.vendor_data != null ? String(parsed.vendor_data).trim() : null;
    const status =
      typeof parsed?.status === "string" ? parsed.status : null;
    const eventId =
      parsed?.event_id != null ? String(parsed.event_id).trim() : null;

    if (!driverId || !status) {
      return new Response("missing data", { status: 400 });
    }

    const [rows] = (await db.query(
      "SELECT id, attempt_details FROM driver_identity_verifications WHERE driver_id = ? LIMIT 1",
      [driverId]
    )) as unknown as [Array<{ id?: unknown; attempt_details?: string | null }>];
    const existente = rows[0];

    let attemptDetails: AttemptDetails = {};
    if (existente?.attempt_details) {
      try {
        attemptDetails = JSON.parse(existente.attempt_details) as AttemptDetails;
      } catch {
        attemptDetails = {};
      }
    }

    const eventIds: string[] = Array.isArray(attemptDetails?.event_ids)
      ? attemptDetails.event_ids.filter(
          (x): x is string => typeof x === "string"
        )
      : [];

    if (eventId && eventIds.includes(eventId)) {
      return new Response("ok");
    }

    if (eventId) eventIds.push(eventId);

    const novoDetails = JSON.stringify({
      ...attemptDetails,
      event_ids: eventIds,
      last_status: status,
      last_event_id: eventId,
      decision: parsed?.decision ?? attemptDetails?.decision ?? null,
    });

    if (existente) {
      await db.query(
        `UPDATE driver_identity_verifications
         SET current_status = ?, attempt_details = ?, updated_at = NOW()
         WHERE id = ?`,
        [status, novoDetails, existente.id]
      );
    } else {
      await db.query(
        `INSERT INTO driver_identity_verifications
         (id, driver_id, current_status, attempt_details, created_at, updated_at)
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [crypto.randomUUID(), driverId, status, novoDetails]
      );
    }

    if (status === "Approved") {
      await db.query(
        "UPDATE driver_details SET is_verified = 1, updated_at = NOW() WHERE user_id = ?",
        [driverId]
      );
    } else if (status === "Kyc Expired" || status === "Declined") {
      await db.query(
        "UPDATE driver_details SET is_verified = 0, updated_at = NOW() WHERE user_id = ?",
        [driverId]
      );
    }

    return new Response("ok");
  } catch (error) {
    console.error("webhook didit - ERRO INTERNO:", error);
    return new Response("error", { status: 500 });
  }
}