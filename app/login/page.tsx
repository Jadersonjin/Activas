import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ardosia-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="font-display text-2xl font-medium text-ardosia-50">Pátio &amp; Armazém</p>
          <p className="text-sm text-ardosia-400 mt-1">Controle operacional diário</p>
        </div>
        <Suspense fallback={<div className="text-ardosia-400 text-sm">Carregando...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
