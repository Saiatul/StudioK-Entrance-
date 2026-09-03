import { NextResponse } from "next/server";
import { createRegistration } from "@/lib/db/registrations";
import { ensureRolesSchema } from "@/lib/db/roles";
import { validateRegistration } from "@/lib/validation/registration";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Unable to complete registration. Please try again." },
      { status: 400 },
    );
  }

  const parsed = validateRegistration(body as Record<string, unknown>);
  if (!parsed.ok) {
    return NextResponse.json(
      {
        error: "Please check the highlighted fields.",
        fieldErrors: parsed.errors,
      },
      { status: 400 },
    );
  }

  try {
    await ensureRolesSchema();
    const registration = await createRegistration(parsed.data);
    return NextResponse.json(registration, { status: 201 });
  } catch (error) {
    console.error("Registration insert failed:", error);
    return NextResponse.json(
      { error: "Unable to complete registration. Please try again." },
      { status: 503 },
    );
  }
}
