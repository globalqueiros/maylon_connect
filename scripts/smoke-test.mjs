#!/usr/bin/env node
/**
 * End-to-end smoke test for Portal Connect.
 * Usage:
 *   node scripts/smoke-test.mjs
 *   BASE_URL=http://localhost:3000 EMAIL=... PASSWORD=... node scripts/smoke-test.mjs
 *
 * Prints only status codes / pass-fail (no tokens or secrets).
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const EMAIL = process.env.EMAIL || "nycollasqueiros16@gmail.com";
const PASSWORD = process.env.PASSWORD || "maylon123";

function cookieHeader(res) {
  const list = res.headers.getSetCookie?.() || [];
  return list.map((c) => c.split(";")[0]).join("; ");
}

async function req(method, path, { cookie, body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json, cookie: cookieHeader(res) || cookie || "" };
}

function pass(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  return ok;
}

async function main() {
  let failed = 0;
  console.log(`Smoke test against ${BASE_URL}`);

  const login = await req("POST", "/api/login", {
    body: { email: EMAIL, password: PASSWORD },
  });
  const loginOk = pass("login", login.status === 200, `status=${login.status}`);
  if (!loginOk) failed++;
  const cookie = login.cookie;
  const userId = Number(login.json?.user?.id || 0);

  const me = await req("GET", "/api/me", { cookie });
  if (!pass("me", me.status === 200, `status=${me.status}`)) failed++;

  const trips = await req("GET", "/api/trips", { cookie });
  if (
    !pass(
      "trips/dashboard data",
      trips.status === 200,
      `status=${trips.status}, count=${Array.isArray(trips.json) ? trips.json.length : "n/a"}`
    )
  ) {
    failed++;
  }

  const banners = await req("GET", "/api/banners", { cookie });
  if (!pass("banners", banners.status === 200, `status=${banners.status}`)) failed++;

  const beneficios = await req("POST", "/api/beneficios", {
    cookie,
    body: { usuario_id: userId || 1 },
  });
  const bens = Array.isArray(beneficios.json) ? beneficios.json : [];
  if (
    !pass(
      "beneficios",
      beneficios.status === 200,
      `status=${beneficios.status}, count=${bens.length}`
    )
  ) {
    failed++;
  }

  const beneficioId = Number(bens[0]?.id || 0);

  // Payment endpoints: 200/201 OK; 4xx/503 business/config OK; only hard 500 fails.
  const pix = await req("POST", "/api/btg/pix/authorize", {
    cookie,
    body: {
      usuario_id: userId || 1,
      beneficio_id: beneficioId || 1,
    },
  });
  const pixOk =
    pix.status < 500 ||
    (pix.status === 503 &&
      String(pix.json?.error || "").includes("Configuração BTG"));
  if (
    !pass(
      "PIX authorize",
      pixOk,
      `status=${pix.status}${pix.json?.error ? `, error=${pix.json.error}` : ""}`
    )
  ) {
    failed++;
  }

  const card = await req("POST", "/api/stripe/checkout", {
    cookie,
    body: {
      usuario_id: userId || 1,
      beneficio_id: beneficioId || 1,
    },
  });
  const cardOk =
    card.status < 500 &&
    (Boolean(card.json?.clientSecret) || Boolean(card.json?.url) || card.status === 400);
  if (
    !pass(
      "card/stripe checkout (in-portal)",
      cardOk,
      `status=${card.status}${card.json?.clientSecret ? ", has_clientSecret" : ""}${card.json?.error ? `, error=${card.json.error}` : ""}`
    )
  ) {
    failed++;
  }

  console.log("");
  if (failed) {
    console.log(`RESULT: ${failed} check(s) failed`);
    process.exit(1);
  }
  console.log("RESULT: all checks passed");
}

main().catch((err) => {
  console.error("RESULT: smoke test crashed —", err.message || err);
  process.exit(1);
});
