export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Locales written right-to-left. */
export const rtlLocales: readonly string[] = ["ar", "fa", "he", "ur"];

export function isRtl(locale: string): boolean {
  return rtlLocales.includes(locale);
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Human label for the language switcher, written in the language itself. */
export const localeLabels: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
};