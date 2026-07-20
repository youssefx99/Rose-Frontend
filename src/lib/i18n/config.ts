export const LOCALES = ["en", "ar"] as const;

export type Locale = (typeof LOCALES)[number];

export type Direction = "ltr" | "rtl";

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_DIR: Record<Locale, Direction> = {
  en: "ltr",
  ar: "rtl",
};

/** Each language is named in its own language — these are never translated. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
};

/**
 * The cookie is the source of truth: the server reads it to render <html lang/dir>
 * correctly on the first paint. localStorage is only a mirror for other tabs —
 * it is never read to decide the rendered locale, or the markup would flash.
 */
export const LOCALE_COOKIE = "rose-locale";
export const LOCALE_STORAGE_KEY = "rose-locale";

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (LOCALES as readonly string[]).includes(value)
  );
}
