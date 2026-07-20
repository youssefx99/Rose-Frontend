"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { LOCALES, LOCALE_LABELS, isLocale } from "./config";
import { useLocale, useT } from "./provider";

export function LanguageSwitcher({ id }: { id?: string }) {
  const { locale, dir, setLocale } = useLocale();
  const t = useT("common");

  return (
    <Select
      value={locale}
      dir={dir}
      onValueChange={(next) => {
        if (isLocale(next)) setLocale(next);
      }}
    >
      <SelectTrigger id={id} aria-label={t("language")} className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LOCALES.map((option) => (
          <SelectItem key={option} value={option}>
            {LOCALE_LABELS[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
