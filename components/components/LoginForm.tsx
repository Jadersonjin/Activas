"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { login } from "@/lib/actions/auth";

export function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <form action={formAction} className="bg-ardosia-900 border border-ardosia-800 rounded-sm p-6 space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label className="block text-xs text-ardosia-400 mb-1">E-mail</label>
        <input
          name="email"
          type="email"
          required
          className="w-full bg-ardosia-800 border border-ardosia-700 rounded-sm px-3 py-2 text-sm text-ardosia-50 outline-none focus:border-ambar-500"
        />
      </div>
      <div>
        <label className="block text-xs text-ardosia-400 mb-1">Senha</label>
        <input
          name="senha"
          type="password"
          required
          className="w-full bg-ardosia-800 border border-ardosia-700 rounded-sm px-3 py-2 text-sm text-ardosia-50 outline-none focus:border-ambar-500"
        />
      </div>
      {state?.erro && <p className="text-sm text-vermelho-500">{state.erro}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-ambar-500 hover:bg-ambar-600 disabled:opacity-60 text-ardosia-950 font-medium text-sm rounded-sm py-2 transition-colors"
      >
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
