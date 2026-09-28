import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Crest } from "@/components/crest";
import { isAdmin } from "@/lib/admin-session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Ingresar", robots: { index: false } };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="grain relative grid min-h-[100svh] place-items-center overflow-hidden bg-ink-900 px-5">
      <div className="pointer-events-none absolute -right-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-emerald-700/30 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-gold-600/15 blur-[120px]" />
      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <Crest className="h-20 w-20" />
          <p className="eyebrow mt-6 text-gold-400">Administrar web</p>
          <h1 className="mt-2 font-display text-4xl text-bone-50">Barbería O&apos;Higgins</h1>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
