import { type NextRequest, NextResponse } from "next/server";
import { LOCALE_COOKIE } from "@/i18n/cookie";
import { defaultLocale, isLocale } from "@/i18n/locale";

/**
 * Next.js 16 proxy (formerly middleware). It does exactly one cheap thing:
 * make sure a locale cookie exists, so the very first paint has the right `dir`
 * and no Arabic user sees a flash of LTR layout.
 *
 * It deliberately does NOT authorise anything. Real permission checks are
 * database-backed and live in src/lib/auth/guard.ts, because the proxy cannot see the
 * session table and a URL is user input. See docs/02-architecture.md.
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  const localeCookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (!localeCookie || !isLocale(localeCookie)) {
    response.cookies.set(LOCALE_COOKIE, defaultLocale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  // Skip Next internals, the API surface and static files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};