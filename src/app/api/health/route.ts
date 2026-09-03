import { NextResponse } from "next/server";
import { getPool } from "@/lib/db/client";

export const runtime = "nodejs";

export async function GET() {
  try {
    const pool = getPool();
    await pool.query("SELECT 1");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Database unavailable." },
      { status: 503 },
    );
  }
}
