"use client";

import { useActionState } from "react";
import { trocarSenha } from "@/lib/actions/auth";

export function TrocarSenhaForm() {
  const [state, formAction, pending] = useActionState(trocarSenha, undefined);

  return (
    <form action={formAction} className="max-w-sm border border-ardosia-200 rounded-sm bg-white p-6 space-y-4">
      <div>
        <label className="block text-xs text-ardosia-600 mb-1">Senha atual</label>
        <input
          name="senhaAtual"
          type="password"
          required
          className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
        />
      </div>
      <div>
        <label className="block text-xs text-ardosia-600 mb-1">Nova senha</label>
        <input
          name="novaSenha"
          type="password"
          required
          minLength={6}
          className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
        />
      </div>
      <div>
        <label className="block text-xs text-ardosia-600 mb-1">Confirmar nova senha</label>
        <input
          name="confirmarSenha"
          type="password"
          required
          minLength={6}
          className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
        />
      </div>
      {state?.erro && <p className="text-sm text-vermelho-500">{state.erro}</p>}
      {state?.sucesso && <p className="text-sm text-verde-500">Senha alterada com sucesso.</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-ardosia-950 hover:bg-ardosia-900 disabled:opacity-60 text-ardosia-50 text-sm rounded-sm py-2 transition-colors"
      >
        {pending ? "Salvando..." : "Trocar senha"}
      </button>
    </form>
  );
}
