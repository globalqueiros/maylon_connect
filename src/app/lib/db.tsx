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

async function logDbConnection(
  label: string,
  pool: mysql.Pool,
  host?: string,
  database?: string
) {
  try {
    const conn = await pool.getConnection();
    await conn.query("SELECT 1");
    conn.release();
    console.log(
      `[DB] ${label}: Connected (host=${host || "n/a"}, database=${database || "n/a"})`
    );
  } catch (error: any) {
    console.error(
      `[DB] ${label}: Not connected (host=${host || "n/a"}, database=${database || "n/a"}) — ${error?.code || error?.message || "unknown error"}`
    );
  }
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

void logDbConnection("db", db, envStr("DB_HOST"), envStr("DB_NAME"));
void logDbConnection("db2", db2, envStr("DB2_HOST"), envStr("DB2_NAME"));
