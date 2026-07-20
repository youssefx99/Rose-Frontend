import { DEFAULT_LOCALE, type Locale } from "./config";
import { MESSAGES } from "./messages";

export type TVars = Record<string, string | number>;

export type TFunction = (key: string, vars?: TVars) => string;

const PLACEHOLDER = /\{(\w+)\}/g;

// Intl.PluralRules construction is expensive relative to a table-cell render.
const pluralRulesCache = new Map<Locale, Intl.PluralRules>();

function pluralRulesFor(locale: Locale): Intl.PluralRules {
  const cached = pluralRulesCache.get(locale);
  if (cached) return cached;
  const created = new Intl.PluralRules(locale);
  pluralRulesCache.set(locale, created);
  return created;
}

/** A bare key resolves inside `namespace`; a key containing a dot is absolute. */
function qualify(key: string, namespace?: string): string {
  return namespace && !key.includes(".") ? `${namespace}.${key}` : key;
}

// An empty message is always an authoring mistake, so treat it as missing and let
// the fallback chain continue rather than rendering a blank label.
function lookup(locale: Locale, key: string): string | undefined {
  const value = MESSAGES[locale][key];
  return value === undefined || value === "" ? undefined : value;
}

/** Active locale → English → undefined. */
function resolve(locale: Locale, key: string): string | undefined {
  if (locale === DEFAULT_LOCALE) return lookup(locale, key);
  return lookup(locale, key) ?? lookup(DEFAULT_LOCALE, key);
}

/**
 * Arabic selects across six CLDR categories (zero/one/two/few/many/other), so a
 * plural message is authored as suffixed variants and picked by Intl.PluralRules.
 * An explicit `_zero` variant wins at count === 0 even in locales where CLDR has
 * no `zero` category (English), matching ICU's exact-value match — otherwise an
 * authored `_zero` would silently never render.
 */
function resolvePlural(
  locale: Locale,
  key: string,
  count: number,
): string | undefined {
  if (count === 0) {
    const zero = resolve(locale, `${key}_zero`);
    if (zero !== undefined) return zero;
  }
  const category = pluralRulesFor(locale).select(count);
  return (
    resolve(locale, `${key}_${category}`) ??
    resolve(locale, `${key}_other`) ??
    resolve(locale, key)
  );
}

function interpolate(template: string, vars?: TVars): string {
  if (!vars) return template;
  return template.replace(PLACEHOLDER, (token, name: string) =>
    name in vars ? String(vars[name]) : token,
  );
}

/**
 * Pure translator — safe to call on the server (generateMetadata) and on the
 * client (useT). An unresolved key renders as the key itself, never as
 * "undefined" or an empty string, so a missing message is visible, not invisible.
 */
export function createTranslator(locale: Locale, namespace?: string): TFunction {
  return (key, vars) => {
    const fullKey = qualify(key, namespace);
    const count = vars?.count;
    const template =
      typeof count === "number"
        ? resolvePlural(locale, fullKey, count)
        : resolve(locale, fullKey);
    return interpolate(template ?? fullKey, vars);
  };
}
