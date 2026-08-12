#!/usr/bin/env node
/**
 * Create or update a local/prod user password.
 *
 * Usage:
 *   node scripts/create-user.mjs --email user@example.com --password secret123
 *   node scripts/create-user.mjs --email user@example.com --password secret123 --type customer --name "Nome"
 */
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import fs from "fs";

function loadEnv() {
  const env = {};
  for (const file of [".env.local", ".env"]) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (!m) continue;
      let v = m[2].trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      const k = m[1].trim();
      if (env[k] === undefined) env[k] = v;
    }
  }
  return env;
}

function arg(name, fallback = "") {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

const email = arg("email");
const password = arg("password");
const fullName = arg("name", "Novo Usuario");
const userType = arg("type", "customer"); // customer | driver

if (!email || !password) {
  console.error(
    "Usage: node scripts/create-user.mjs --email user@example.com --password secret123 [--type customer|driver] [--name \"Full Name\"]"
  );
  process.exit(1);
}

const env = loadEnv();
const hash = await bcrypt.hash(password, 10);

const db = await mysql.createConnection({
  host: env.DB_HOST,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
});

await db.query(
  `INSERT INTO users (full_name, phone, email, password, user_type, email_verified_at)
   VALUES (?, ?, ?, ?, ?, NOW())
   ON DUPLICATE KEY UPDATE
     password = VALUES(password),
     user_type = VALUES(user_type),
     full_name = VALUES(full_name)`,
  [fullName, "11999999999", email, hash, userType]
);

const [rows] = await db.query(
  "SELECT id, email, full_name, user_type FROM users WHERE email = ? LIMIT 1",
  [email]
);
console.log("User ready:", rows[0]);
await db.end();
