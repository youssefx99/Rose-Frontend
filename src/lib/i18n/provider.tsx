"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import {
  LOCALE_COOKIE,
  LOCALE_DIR,
  LOCALE_STORAGE_KEY,
  type Direction,
  type Locale,
} from "./config";
import { createTranslator, type TFunction } from "./translate";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

interface LocaleContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  dir: Direction;
  isRtl: boolean;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

/**
 * `initialLocale` comes from the server (cookie), so <html lang/dir> and the
 * first client render already agree — no flash, no hydration mismatch. Never
 * seed this from localStorage in an effect.
 */
export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);

    // Direction is an attribute on <html>, which React does not own here.
    document.documentElement.lang = next;
    document.documentElement.dir = LOCALE_DIR[next];

    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode, blocked cookies). The cookie
      // above is the source of truth, so the preference still survives a reload.
    }
  }, []);

  const value = useMemo<LocaleContextValue>(() => {
    const dir = LOCALE_DIR[locale];
    return { locale, setLocale, dir, isRtl: dir === "rtl" };
  }, [locale, setLocale]);

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return ctx;
}

/**
 * `useT("claims")` — t("title") resolves to "claims.title", while a dotted key
 * stays absolute: t("common.save") works from any namespace.
 */
export function useT(namespace?: string): TFunction {
  const { locale } = useLocale();
  return useMemo(() => createTranslator(locale, namespace), [locale, namespace]);
}
