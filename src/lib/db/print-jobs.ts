import { getPool } from "@/lib/db/client";

const TABLE = "print_jobs";

let schemaReady = false;

export async function ensurePrintJobsSchema(): Promise<void> {
  if (schemaReady) return;

  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT '',
      associated_to TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    ALTER TABLE ${TABLE}
    ADD COLUMN IF NOT EXISTS associated_to TEXT NOT NULL DEFAULT '';
  `);

  schemaReady = true;
}

export type PrintJob = {
  id: number;
  name: string;
  role: string;
  associated_to: string;
  created_at: string;
};

export async function enqueuePrintJob(
  name: string,
  role: string,
  associatedTo = "",
): Promise<PrintJob> {
  await ensurePrintJobsSchema();
  const pool = getPool();
  const result = await pool.query(
    `
      INSERT INTO ${TABLE} (name, role, associated_to)
      VALUES ($1, $2, $3)
      RETURNING id, name, role, associated_to, created_at
    `,
    [name, role ?? "", associatedTo ?? ""],
  );
  const row = result.rows[0];
  return {
    id: Number(row.id),
    name: row.name,
    role: row.role ?? "",
    associated_to: row.associated_to ?? "",
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
      DELETE FROM ${TABLE}
      WHERE id = (
        SELECT id FROM ${TABLE}
        ORDER BY created_at ASC, id ASC
        LIMIT 1
      )
      RETURNING id, name, role, associated_to, created_at
    `,
  );

  void limit;

  return result.rows.map((row) => ({
    id: Number(row.id),
    name: row.name,
    role: row.role ?? "",
    associated_to: row.associated_to ?? "",
    created_at:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  }));
}
