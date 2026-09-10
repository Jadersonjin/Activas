import { NextRequest, NextResponse } from "next/server";
import { decodeSession, COOKIE_NAME } from "@/lib/session-core";

const PUBLIC_PATHS = ["/login"];
const CONFERENTE_PATHS = ["/contagem", "/perfil"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = await decodeSession(token);

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Conferente só acessa a tela de contagem (e o próprio perfil) — qualquer outra rota redireciona pra lá
  if (session.papel === "CONFERENTE" && !CONFERENTE_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/contagem", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/public|_next/static|_next/image|favicon.ico).*)"],
  runtime: "nodejs",
};
