const COOKIE_NAME = "studiok_admin_session";
const SESSION_DAYS = 7;

const DEFAULT_EMAILS = ["prince@studiok.dev", "amir@studiok.dev"];
const DEFAULT_PASSWORD = "studio@gatepass2026";
const DEFAULT_SECRET = "studiok-admin-session-2026";

function allowedEmails(): string[] {
  const fromEnv = process.env.ADMIN_EMAILS;
  if (!fromEnv) return DEFAULT_EMAILS;
  return fromEnv
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
}

function sessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || DEFAULT_SECRET;
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function hmacSign(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(sessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return toBase64Url(signature);
}

async function hmacVerify(message: string, signature: string): Promise<boolean> {
  const expected = await hmacSign(message);
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

export function getAdminCookieName() {
  return COOKIE_NAME;
}

export function isAllowedAdminEmail(email: string): boolean {
  return allowedEmails().includes(email.trim().toLowerCase());
}

export function verifyAdminCredentials(email: string, password: string): boolean {
  if (!isAllowedAdminEmail(email)) return false;
  return password === adminPassword();
}

export async function createAdminSessionToken(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${normalized}.${expiresAt}`;
  const signature = await hmacSign(payload);
  return `${payload}.${signature}`;
}

export async function readAdminSession(
  token: string | undefined | null,
): Promise<{ email: string } | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [email, expiresRaw, signature] = parts;
  const expiresAt = Number(expiresRaw);
  if (!email || !Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return null;
  }

  const ok = await hmacVerify(`${email}.${expiresAt}`, signature);
  if (!ok) return null;
  if (!isAllowedAdminEmail(email)) return null;
  return { email };
}

export function adminSessionCookieOptions(maxAgeSeconds = SESSION_DAYS * 24 * 60 * 60) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
