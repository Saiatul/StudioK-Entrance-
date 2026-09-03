import { NextResponse } from "next/server";
import { listRoles } from "@/lib/db/roles";

export const runtime = "nodejs";

export async function GET() {
  try {
    const roles = await listRoles();
    return NextResponse.json({ roles });
  } catch (error) {
    console.error("Roles lookup failed:", error);
    return NextResponse.json(
      { error: "Unable to load roles. Please try again." },
      { status: 503 },
    );
  }
}
