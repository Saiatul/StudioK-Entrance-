import { NextRequest, NextResponse } from "next/server";
import { createHost, listHosts } from "@/lib/db/hosts";

export const runtime = "nodejs";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  try {
    const hosts = await listHosts();
    return NextResponse.json({ hosts });
  } catch (error) {
    console.error("Admin hosts lookup failed:", error);
    return NextResponse.json(
      { error: "Unable to load hosts." },
      { status: 503 },
    );
  }
}

export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();

  if (!name || name.length > 120) {
    return NextResponse.json(
      { error: "Please enter a valid host name." },
      { status: 400 },
    );
  }
  if (!email || !EMAIL_PATTERN.test(email) || email.length > 254) {
    return NextResponse.json(
      { error: "Please enter a valid host email." },
      { status: 400 },
    );
  }

  try {
    const host = await createHost(name, email);
    return NextResponse.json({ host }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("unique") || message.includes("duplicate")) {
      return NextResponse.json(
        { error: "A host with this name already exists." },
        { status: 409 },
      );
    }
    console.error("Admin create host failed:", error);
    return NextResponse.json(
      { error: "Unable to add host." },
      { status: 503 },
    );
  }
}
