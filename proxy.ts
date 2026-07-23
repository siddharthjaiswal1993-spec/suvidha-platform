import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js 16 renamed `middleware.ts` to `proxy.ts` (same capabilities). This only checks for the
 * presence of the demo session cookie and redirects to /login if missing — it cannot query the
 * database (Edge-compatible), so role-specific authorization (citizen vs. ops) happens in each
 * route group's layout.tsx, which runs as a Server Component with full Prisma access.
 */
const SESSION_COOKIE = "suvidha_session";
const PROTECTED_PREFIXES = ["/home", "/profile", "/institutions", "/documents", "/requests", "/inbox", "/life-events", "/financial", "/family-access", "/legacy", "/assistant", "/help", "/consent", "/settings", "/ops"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isProtected && !request.cookies.get(SESSION_COOKIE)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const proxyConfig = {
  matcher: [
    "/home/:path*",
    "/profile/:path*",
    "/institutions/:path*",
    "/documents/:path*",
    "/requests/:path*",
    "/inbox/:path*",
    "/life-events/:path*",
    "/financial/:path*",
    "/family-access/:path*",
    "/legacy/:path*",
    "/assistant/:path*",
    "/help/:path*",
    "/consent/:path*",
    "/settings/:path*",
    "/ops/:path*",
  ],
};
