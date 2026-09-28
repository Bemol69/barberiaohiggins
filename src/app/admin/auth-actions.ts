"use server";

import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/session";

export type LoginState = { error?: string };

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return { error: "Falta configurar ADMIN_PASSWORD en el servidor." };
  if (process.env.NODE_ENV === "production" && (process.env.SESSION_SECRET ?? "").length < 32) {
    return { error: "Falta configurar SESSION_SECRET (32+ caracteres) en el servidor." };
  }

  const password = String(formData.get("password") ?? "");
  // Pequeña pausa para frenar intentos por fuerza bruta.
  await new Promise((r) => setTimeout(r, 400));
  if (!safeEqual(password, expected)) return { error: "Contraseña incorrecta." };

  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken(), sessionCookieOptions);
  redirect("/admin");
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/admin/login");
}
