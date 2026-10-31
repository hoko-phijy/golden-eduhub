import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { LOCALE_COOKIE } from "./cookie";
import { defaultLocale, isLocale, type Locale } from "./locale";

/**
 * Locale is resolved from a cookie, not a URL segment.
 *
 * Rationale: the app has no SEO-driven public pages (enrolment is admin-controlled), and
 * every route in docs/05-screens-and-routes.md is written without a locale prefix. A cookie
 * keeps those URLs stable while still giving each user their own language, and it avoids
 * duplicating every route under /en and /ar.
 */
export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(cookieLocale ?? "")
    ? (cookieLocale as Locale)
    : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});