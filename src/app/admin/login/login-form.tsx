"use client";

import { useActionState } from "react";
import { login, type LoginState } from "../auth-actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="mt-10 rounded-3xl border border-bone-100/10 bg-ink-800/70 p-7 backdrop-blur">
      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-bone-400">Contraseña</span>
        <input name="password" type="password" required autoFocus autoComplete="current-password" className="field" />
      </label>
      {state.error && (
        <p role="alert" className="mt-4 text-sm text-crimson-500">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-gold mt-6 w-full !py-3.5">
        {pending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
