/**
 * Shared between the server locale resolver and the client language switcher.
 * Kept in its own module so a client component never imports server-only code.
 */
export const LOCALE_COOKIE = "golden_locale";
export const THEME_COOKIE = "golden_theme";