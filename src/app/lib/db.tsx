import mysql from "mysql2/promise";

function envStr(key: string): string | undefined {
  const value = process.env[key];
  if (value == null) return undefined;
  // Strip CR from Windows-edited .env files and accidental wrapping quotes.
  const cleaned = value.replace(/\r/g, "").trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    return cleaned.slice(1, -1);
  }
  return cleaned;
}

export const db = mysql.createPool({
  host: envStr("DB_HOST"),
  user: envStr("DB_USER"),
  password: envStr("DB_PASSWORD"),
  database: envStr("DB_NAME"),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const db2 = mysql.createPool({
  host: envStr("DB2_HOST"),
  user: envStr("DB2_USER"),
  password: envStr("DB2_PASSWORD"),
  database: envStr("DB2_NAME"),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

