import { NextResponse } from "next/server";
import { getRegistrationById } from "@/lib/db/registrations";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId < 1) {
    return NextResponse.json({ error: "Registration not found." }, { status: 404 });
  }

  try {
    const registration = await getRegistrationById(numericId);
    if (!registration) {
      return NextResponse.json({ error: "Registration not found." }, { status: 404 });
    }
    return NextResponse.json(registration);
  } catch (error) {
    console.error("Registration lookup failed:", error);
    return NextResponse.json(
      { error: "Unable to load registration. Please try again." },
      { status: 503 },
    );
  }
}
