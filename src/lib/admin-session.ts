import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "boh_admin";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 días

/** El token del admin. ADMIN_PASSWORD se acepta por compatibilidad. */
export function adminToken(): string {
  return (process.env.ADMIN_TOKEN || process.env.ADMIN_PASSWORD || "").trim();
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

// La cookie se firma con una clave derivada del token: si cambias el token, se cierran todas las sesiones.
function sign(value: string): string {
  const key = createHash("sha256").update(`boh-admin:${adminToken()}`).digest();
  return createHmac("sha256", key).update(value).digest("base64url");
}

export function tokenMatches(input: string): boolean {
  const token = adminToken();
  return token.length > 0 && safeEqual(input.trim(), token);
}

export async function startSession(): Promise<void> {
  const expires = String(Date.now() + MAX_AGE * 1000);
  (await cookies()).set(COOKIE, `${expires}.${sign(expires)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  if (!adminToken()) return false;
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return false;
  const [expires, signature] = value.split(".");
  if (!expires || !signature || Number(expires) < Date.now()) return false;
  return safeEqual(signature, sign(expires));
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}
