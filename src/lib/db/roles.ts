import { getPool } from "@/lib/db/client";
import { ROLES } from "@/types/registration";

const TABLE = '"Roles"';

let schemaReady = false;

export async function ensureRolesSchema(): Promise<void> {
  if (schemaReady) return;

  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );
  `);

  for (const name of ROLES) {
    await pool.query(
      `INSERT INTO ${TABLE} (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
      [name],
    );
  }

  schemaReady = true;
}

export async function listRoles(): Promise<string[]> {
  await ensureRolesSchema();

  const pool = getPool();
  const result = await pool.query(`SELECT name FROM ${TABLE} ORDER BY id ASC`);
  const names = result.rows
    .map((row: { name: string }) => row.name)
    .filter(Boolean);

  return names.length > 0 ? names : [...ROLES];
}
