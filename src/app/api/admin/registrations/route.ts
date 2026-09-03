import { NextResponse } from "next/server";
import { getPool } from "@/lib/db/client";
import { ensureRegistrationsSchema } from "@/lib/db/registrations";

export async function GET() {
  await ensureRegistrationsSchema();
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, name, country_code, mobile, email, host, role, legal_accepted, registered_at
     FROM "Registrations"
     ORDER BY registered_at DESC`
  );
  return NextResponse.json({ registrations: result.rows });
}
