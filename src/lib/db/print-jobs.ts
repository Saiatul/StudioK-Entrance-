import { getPool } from "@/lib/db/client";

const TABLE = '"PrintJobs"';

let schemaReady = false;

export async function ensurePrintJobsSchema(): Promise<void> {
  if (schemaReady) return;

  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  schemaReady = true;
}

export type PrintJob = {
  id: number;
  name: string;
  role: string;
  created_at: string;
};

export async function enqueuePrintJob(
  name: string,
  role: string,
): Promise<PrintJob> {
  await ensurePrintJobsSchema();
  const pool = getPool();
  const result = await pool.query(
    `
      INSERT INTO ${TABLE} (name, role)
      VALUES ($1, $2)
      RETURNING id, name, role, created_at
    `,
    [name, role ?? ""],
  );
  const row = result.rows[0];
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    created_at:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}

/** Claim and return the next pending job (oldest first). */
export async function claimPrintJobs(limit = 1): Promise<PrintJob[]> {
  await ensurePrintJobsSchema();
  const pool = getPool();
  const result = await pool.query(
    `
      WITH claimed AS (
        DELETE FROM ${TABLE}
        WHERE id IN (
          SELECT id FROM ${TABLE}
          ORDER BY created_at ASC, id ASC
          FOR UPDATE SKIP LOCKED
          LIMIT $1
        )
        RETURNING id, name, role, created_at
      )
      SELECT id, name, role, created_at FROM claimed
      ORDER BY created_at ASC, id ASC
    `,
    [limit],
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    role: row.role,
    created_at:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  }));
}
