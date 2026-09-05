import { getPool } from "@/lib/db/client";

const TABLE = "hosts";

export type HostRecord = {
  id: number;
  name: string;
  email: string;
};

const DEFAULT_HOSTS: Array<{ name: string; email: string }> = [
  { name: "Amir Khan", email: "amir@studiok.dev" },
  { name: "Prince Sah", email: "prince@studiok.dev" },
];

let schemaReady = false;

export async function ensureHostsSchema(): Promise<void> {
  if (schemaReady) return;

  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  for (const host of DEFAULT_HOSTS) {
    await pool.query(
      `
        INSERT INTO ${TABLE} (name, email)
        VALUES ($1, $2)
        ON CONFLICT (name) DO NOTHING
      `,
      [host.name, host.email],
    );
  }

  schemaReady = true;
}

export async function listHosts(): Promise<HostRecord[]> {
  await ensureHostsSchema();
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, name, email FROM ${TABLE} ORDER BY name ASC`,
  );
  return result.rows.map((row) => ({
    id: Number(row.id),
    name: row.name,
    email: row.email,
  }));
}

export async function hostExists(name: string): Promise<boolean> {
  await ensureHostsSchema();
  const pool = getPool();
  const result = await pool.query(
    `SELECT 1 FROM ${TABLE} WHERE lower(name) = lower($1) LIMIT 1`,
    [name.trim()],
  );
  return result.rows.length > 0;
}

export async function createHost(
  name: string,
  email: string,
): Promise<HostRecord> {
  await ensureHostsSchema();
  const pool = getPool();
  const result = await pool.query(
    `
      INSERT INTO ${TABLE} (name, email)
      VALUES ($1, $2)
      RETURNING id, name, email
    `,
    [name.trim(), email.trim().toLowerCase()],
  );
  const row = result.rows[0];
  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
  };
}

export async function deleteHost(id: number): Promise<boolean> {
  await ensureHostsSchema();
  const pool = getPool();
  const result = await pool.query(
    `DELETE FROM ${TABLE} WHERE id = $1 RETURNING id`,
    [id],
  );
  return result.rows.length > 0;
}
