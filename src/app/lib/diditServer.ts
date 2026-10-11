import { cookies } from "next/headers";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { db } from "./db";
import { DIDIT_API_URL, DIDIT_WORKFLOW_ID } from "./didit";

export function cleanSecret(value?: string): string {
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

export async function usuarioDoToken(): Promise<{
  id: string | null;
  tipo: string | null;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    if (!token) return { id: null, tipo: null };

    const secret = cleanSecret(process.env.JWT_SECRET);
    if (!secret) return { id: null, tipo: null };

    const decoded = jwt.verify(token, secret) as jwt.JwtPayload & {
      id?: unknown;
      usuario_id?: unknown;
      user_id?: unknown;
      user_type?: unknown;
    };

    const rawId =
      decoded?.id ?? decoded?.usuario_id ?? decoded?.user_id ?? null;

    const id = rawId != null ? String(rawId).trim() : null;

    const tipo =
      decoded?.user_type != null
        ? String(decoded.user_type).trim().toLowerCase()
        : null;

    return { id, tipo };
  } catch {
    return { id: null, tipo: null };
  }
}

export type SessaoDidit =
  | { ok: true; sessionId: string; url: string }
  | { ok: false; error: "not_configured" | "session_create_failed" | "unexpected" };

export async function criarSessaoDidit(
  userId: string
): Promise<SessaoDidit> {
  const apiKey = cleanSecret(process.env.DIDIT_API_KEY);

  if (!apiKey) {
    console.error("criarSessaoDidit: DIDIT_API_KEY ausente");
    return { ok: false, error: "not_configured" };
  }

  const res = await fetch(`${DIDIT_API_URL}/v3/session/`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      workflow_id: DIDIT_WORKFLOW_ID,
      vendor_data: userId,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("criarSessaoDidit: erro na Didit:", res.status, detail);
    return { ok: false, error: "session_create_failed" };
  }

  const session = (await res.json()) as {
    session_id?: string;
    url?: string;
  };

  const sessionId = session?.session_id;
  const url = session?.url;

  if (!sessionId || !url) {
    return { ok: false, error: "unexpected" };
  }

  return { ok: true, sessionId, url };
}

export async function salvarSessaoVerificacao(
  userId: string,
  sessionId: string,
  url: string
): Promise<void> {
  try {
    const [rows] = (await db.query(
      "SELECT id, attempt_details FROM driver_identity_verifications WHERE driver_id = ? LIMIT 1",
      [userId]
    )) as unknown as [Array<{ id?: unknown; attempt_details?: unknown }>];
    const existente = rows[0];

    let detalhesAnteriores: Record<string, unknown> = {};
    if (existente?.attempt_details) {
      try {
        const detalhes =
          typeof existente.attempt_details === "string"
            ? JSON.parse(existente.attempt_details)
            : existente.attempt_details;
        if (detalhes && typeof detalhes === "object") {
          detalhesAnteriores = detalhes as Record<string, unknown>;
        }
      } catch {
        detalhesAnteriores = {};
      }
    }

    const attemptDetails = JSON.stringify({
      ...detalhesAnteriores,
      session_id: sessionId,
      url,
      event_ids: [],
    });

    if (existente) {
      await db.query(
        `UPDATE driver_identity_verifications
         SET current_status = ?, attempt_details = ?, updated_at = NOW()
         WHERE driver_id = ?`,
        ["Not Started", attemptDetails, userId]
      );
    } else {
      await db.query(
        `INSERT INTO driver_identity_verifications
         (id, driver_id, current_status, attempt_details, created_at, updated_at)
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [crypto.randomUUID(), userId, "Not Started", attemptDetails]
      );
    }
  } catch (dbError) {
    console.error(
      "salvarSessaoVerificacao: erro ao salvar sessão no banco:",
      dbError
    );
  }
}
