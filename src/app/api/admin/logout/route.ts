import { NextResponse } from "next/server";
import { adminSessionCookieOptions, getAdminCookieName } from "@/lib/admin-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(getAdminCookieName(), "", {
    ...adminSessionCookieOptions(0),
    maxAge: 0,
  });
  return response;
}
