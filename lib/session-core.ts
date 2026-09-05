// Funções puras de assinatura/verificação de sessão, sem nenhuma dependência
// de "next/headers" — este arquivo pode ser importado com segurança pelo
// middleware.ts (Edge Runtime), além do resto do app (Node.js runtime).

export const COOKIE_NAME = "armazem_session";
const SECRET = process.env.SESSION_SECRET || "troque-este-segredo-em-producao";

export type SessionPayload = {
  userId: string;
  nome: string;
  email: string;
  papel: "ADMIN" | "OPERADOR";
};

function bufferToHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function base64UrlEncode(input: string) {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(input: string) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(input.length + ((4 - (input.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function getKey() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function sign(value: string): Promise<string> {
  const key = await getKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return bufferToHex(signature);
}

export async function encodeSession(payload: SessionPayload) {
  const json = base64UrlEncode(JSON.stringify(payload));
  const signature = await sign(json);
  return `${json}.${signature}`;
}

export async function decodeSession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  const [json, signature] = token.split(".");
  if (!json || !signature) return null;
  const expected = await sign(json);
  if (expected !== signature) return null;
  try {
    return JSON.parse(base64UrlDecode(json));
  } catch {
    return null;
  }
}
