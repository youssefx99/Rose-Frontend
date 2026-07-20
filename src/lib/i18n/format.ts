import { useMemo } from "react";

import type { Locale } from "./config";
import { useLocale } from "./provider";

/**
 * Arabic formats with WESTERN digits (-u-nu-latn), not Eastern Arabic-Indic.
 * This is a financial ledger: every money column is tabular-nums and reconciles
 * against Billing.xlsx and payer EOBs, which are Western. Mixing numeral systems
 * would break column alignment and make reconciliation unreadable.
 * `ar-EG` alone resolves to nu=arab — the extension is required, not decorative.
 */
const NUMBER_LOCALE: Record<Locale, string> = {
  en: "en-US",
  ar: "ar-EG-u-nu-latn",
};

/** Also pinned to the Gregorian calendar: ledger dates of service are Gregorian, not Hijri. */
const DATE_LOCALE: Record<Locale, string> = {
  en: "en-US",
  ar: "ar-EG-u-nu-latn-ca-gregory",
};

const DEFAULT_CURRENCY = "USD";
const EM_DASH = "—";
const MS_PER_DAY = 86_400_000;

export interface Formatter {
  /** Localised relative time, e.g. "3 days ago" / "قبل 3 أيام". */
  timeAgo: (value: string | null | undefined) => string;
  /** Whole days elapsed; negative for future dates. Not localised — it is a count. */
  daysSince: (value: string | null | undefined) => number;
  formatNumber: (value: string | number | null | undefined) => string;
  formatMoney: (
    value: string | number | null | undefined,
    currency?: string,
  ) => string;
  /** A 0..1 ratio as a percentage, e.g. 0.3149 → "31.49%". */
  formatPercent: (
    value: string | number | null | undefined,
    fractionDigits?: number,
  ) => string;
  formatDate: (value: string | null | undefined) => string;
  formatDateTime: (value: string | null | undefined) => string;
  /** "2026-05" → "May". Short enough to sit under a chart axis. */
  formatMonth: (value: string | null | undefined) => string;
}

function toTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function createFormatter(locale: Locale): Formatter {
  const numberTag = NUMBER_LOCALE[locale];
  const dateTag = DATE_LOCALE[locale];

  // Intl constructors are expensive; a claims table formats money hundreds of
  // times per render, so build each formatter once per locale.
  const number = new Intl.NumberFormat(numberTag);
  const date = new Intl.DateTimeFormat(dateTag);
  const dateTime = new Intl.DateTimeFormat(dateTag, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const monthLabel = new Intl.DateTimeFormat(dateTag, {
    month: "short",
    timeZone: "UTC",
  });
  const relative = new Intl.RelativeTimeFormat(numberTag, { numeric: "auto" });
  const moneyByCurrency = new Map<string, Intl.NumberFormat>();
  const percentByDigits = new Map<number, Intl.NumberFormat>();

  const money = (currency: string): Intl.NumberFormat => {
    const cached = moneyByCurrency.get(currency);
    if (cached) return cached;
    const created = new Intl.NumberFormat(numberTag, {
      style: "currency",
      currency,
    });
    moneyByCurrency.set(currency, created);
    return created;
  };

  const daysSince: Formatter["daysSince"] = (value) => {
    const time = toTime(value);
    if (time === null) return 0;
    return Math.trunc((Date.now() - time) / MS_PER_DAY);
  };

  return {
    daysSince,

    timeAgo: (value) => {
      const time = toTime(value);
      if (time === null) return EM_DASH;
      const days = Math.trunc((Date.now() - time) / MS_PER_DAY);
      const magnitude = Math.abs(days);
      // numeric:"auto" yields "today"/"yesterday" ("اليوم"/"أمس") instead of "0 days ago".
      if (magnitude < 7) return relative.format(-days, "day");
      if (magnitude < 30) return relative.format(-Math.trunc(days / 7), "week");
      if (magnitude < 365) return relative.format(-Math.trunc(days / 30), "month");
      return relative.format(-Math.trunc(days / 365), "year");
    },

    formatNumber: (value) => {
      const parsed = toNumber(value);
      return parsed === null ? EM_DASH : number.format(parsed);
    },

    formatMoney: (value, currency = DEFAULT_CURRENCY) => {
      const parsed = toNumber(value);
      if (parsed === null) return EM_DASH;
      const formatted = money(currency).format(parsed);
      // ar-EG's CLDR data renders USD as "US$" to disambiguate from EGP;
      // this ledger only ever holds USD, so the disambiguation is noise.
      return currency === "USD" ? formatted.replace("US$", "$") : formatted;
    },

    formatPercent: (value, fractionDigits = 2) => {
      const parsed = toNumber(value);
      if (parsed === null) return EM_DASH;
      let percent = percentByDigits.get(fractionDigits);
      if (!percent) {
        percent = new Intl.NumberFormat(numberTag, {
          style: "percent",
          minimumFractionDigits: fractionDigits,
          maximumFractionDigits: fractionDigits,
        });
        percentByDigits.set(fractionDigits, percent);
      }
      return percent.format(parsed);
    },

    formatDate: (value) => {
      const time = toTime(value);
      return time === null ? EM_DASH : date.format(time);
    },

    formatDateTime: (value) => {
      const time = toTime(value);
      return time === null ? EM_DASH : dateTime.format(time);
    },

    formatMonth: (value) => {
      const time = toTime(value ? `${value}-01T00:00:00Z` : value);
      return time === null ? EM_DASH : monthLabel.format(time);
    },
  };
}

/** Formatters bound to the active locale. Prefer this over @/lib/format in components. */
export function useFormat(): Formatter {
  const { locale } = useLocale();
  return useMemo(() => createFormatter(locale), [locale]);
}
