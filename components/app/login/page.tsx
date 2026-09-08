import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";
import { BrasmegLogo } from "@/components/BrasmegLogo";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ardosia-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <BrasmegLogo tema="escuro" />
          <p className="text-sm text-ardosia-400 mt-3">Controle operacional diário</p>
        </div>
        <Suspense fallback={<div className="text-ardosia-400 text-sm">Carregando...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
