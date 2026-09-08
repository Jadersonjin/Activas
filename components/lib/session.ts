import { cookies } from "next/headers";
import {
  COOKIE_NAME,
  encodeSession,
  decodeSession,
  type SessionPayload,
} from "@/lib/session-core";

// Reexporta o necessário para quem já importava de "@/lib/session"
export { COOKIE_NAME, encodeSession, decodeSession };
export type { SessionPayload };

// As funções abaixo usam "next/headers" e só podem rodar em
// Server Components / Server Actions (Node.js runtime) — nunca no middleware.

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return decodeSession(store.get(COOKIE_NAME)?.value);
}

export async function createSessionCookie(payload: SessionPayload) {
  const store = await cookies();
  store.set(COOKIE_NAME, await encodeSession(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
