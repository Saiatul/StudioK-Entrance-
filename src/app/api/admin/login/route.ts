import { NextRequest, NextResponse } from "next/server";
import {
  adminSessionCookieOptions,
  createAdminSessionToken,
  getAdminCookieName,
  verifyAdminCredentials,
} from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!verifyAdminCredentials(email, password)) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const token = await createAdminSessionToken(email);
  const response = NextResponse.json({ ok: true, email });
  response.cookies.set(
    getAdminCookieName(),
    token,
    adminSessionCookieOptions(),
  );
  return response;
}
