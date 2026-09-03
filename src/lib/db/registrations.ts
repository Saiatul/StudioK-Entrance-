import { getPool } from "@/lib/db/client";
import type { Registration, RegistrationInput } from "@/types/registration";

const TABLE = '"Registrations"';

let schemaReady = false;

export async function ensureRegistrationsSchema(): Promise<void> {
  if (schemaReady) return;

  const pool = getPool();
  await pool.query(`
    ALTER TABLE ${TABLE}
    ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);
  await pool.query(`
    ALTER TABLE ${TABLE}
    ADD COLUMN IF NOT EXISTS role TEXT;
  `);

  schemaReady = true;
}

function mapRow(row: {
  id: number;
  name: string;
  country_code: string;
  mobile: string;
  email: string;
  host: string;
  role?: string | null;
  legal_accepted: boolean;
  registered_at: Date | string;
}): Registration {
  const registeredAt =
    row.registered_at instanceof Date
      ? row.registered_at.toISOString()
      : new Date(row.registered_at).toISOString();

  return {
    id: row.id,
    name: row.name,
    country_code: row.country_code,
    mobile: row.mobile,
    email: row.email,
    host: row.host,
    role: row.role || "",
    legal_accepted: row.legal_accepted,
    registered_at: registeredAt,
  };
}

export async function createRegistration(
  input: RegistrationInput,
): Promise<Registration> {
  await ensureRegistrationsSchema();

  const pool = getPool();
  const result = await pool.query(
    `
      INSERT INTO ${TABLE}
        (name, country_code, mobile, email, host, role, legal_accepted, registered_at)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING
        id, name, country_code, mobile, email, host, role, legal_accepted, registered_at
    `,
    [
      input.name,
      input.country_code,
      input.mobile,
      input.email,
      input.host,
      input.role,
      input.legal_accepted,
    ],
  );

  return mapRow(result.rows[0]);
}

export async function getRegistrationById(
  id: number,
): Promise<Registration | null> {
  await ensureRegistrationsSchema();

  const pool = getPool();
  const result = await pool.query(
    `
      SELECT id, name, country_code, mobile, email, host, role, legal_accepted, registered_at
      FROM ${TABLE}
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  if (!result.rows[0]) return null;
  return mapRow(result.rows[0]);
}

// Reserved for a future duplicate-detection rule. Not enforced in v1.
export async function findRecentByMobile(
  countryCode: string,
  mobile: string,
): Promise<Registration | null> {
  await ensureRegistrationsSchema();

  const pool = getPool();
  const result = await pool.query(
    `
      SELECT id, name, country_code, mobile, email, host, role, legal_accepted, registered_at
      FROM ${TABLE}
      WHERE country_code = $1 AND mobile = $2
      ORDER BY registered_at DESC
      LIMIT 1
    `,
    [countryCode, mobile],
  );

  if (!result.rows[0]) return null;
  return mapRow(result.rows[0]);
}
