import { NextResponse } from "next/server";
import { listHosts } from "@/lib/db/hosts";

export const runtime = "nodejs";

export async function GET() {
  try {
    const hosts = await listHosts();
    return NextResponse.json({
      hosts: hosts.map((h) => ({ id: h.id, name: h.name, email: h.email })),
    });
  } catch (error) {
    console.error("Hosts lookup failed:", error);
    return NextResponse.json(
      { error: "Unable to load hosts. Please try again." },
      { status: 503 },
    );
  }
}
