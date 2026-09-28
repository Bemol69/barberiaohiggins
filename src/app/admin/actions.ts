"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { contentSchema } from "@/content/schema";
import { adminToken, endSession, isAdmin, startSession, tokenMatches } from "@/lib/admin-session";
import { CONTENT_TAG, writeContent } from "@/lib/content";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!adminToken()) {
    return { error: "Falta configurar la variable ADMIN_TOKEN en el servidor." };
  }
  // Pausa corta para frenar intentos por fuerza bruta.
  await new Promise((r) => setTimeout(r, 400));
  if (!tokenMatches(String(formData.get("token") ?? ""))) {
    return { error: "Token incorrecto." };
  }
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  revalidatePath("/", "layout");
  redirect("/");
}

export type SaveResult = { ok: true } | { ok: false; error: string };

export async function saveContent(input: unknown): Promise<SaveResult> {
  if (!(await isAdmin())) return { ok: false, error: "La sesión expiró. Vuelve a ingresar con tu token." };

  const parsed = contentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Hay datos inválidos." };
  }

  try {
    await writeContent(parsed.data);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo guardar." };
  }

  updateTag(CONTENT_TAG);
  revalidatePath("/", "layout");
  return { ok: true };
}
