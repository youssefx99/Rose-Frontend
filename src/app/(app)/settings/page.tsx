"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Save, Coins, Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { getSettings, updateSettings, type OrgSettings } from "@/lib/settings";
import { LanguageSwitcher } from "@/lib/i18n/language-switcher";
import { useT } from "@/lib/i18n/provider";

/** Carbon-style switch (no toggle primitive exists in the design system yet). */
function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-[var(--dur-fast-02)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-interactive" : "bg-border-strong",
      )}
    >
      <span
        className={cn(
          "inline-block size-5 rounded-full bg-white shadow transition-transform duration-[var(--dur-fast-02)]",
          checked
            ? "translate-x-[22px] rtl:-translate-x-[22px]"
            : "translate-x-0.5 rtl:-translate-x-0.5",
        )}
      />
    </button>
  );
}

/** One labeled row with a control on the right. */
function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-4">
      <div className="min-w-0 space-y-0.5">
        <p className="type-body-compact-01 font-medium text-text-primary">
          {title}
        </p>
        <p className="type-label-01 text-text-secondary">{description}</p>
      </div>
      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { can } = useAuth();
  const t = useT();
  const canEdit = can("settings.edit");

  const [initial, setInitial] = useState<OrgSettings | null>(null);
  const [form, setForm] = useState<OrgSettings | null>(null);
  const [rateText, setRateText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSettings();
      setInitial(data);
      setForm(data);
      setRateText(String(data.usdToEgpRate));
    } catch {
      toast.error(t("errors.loadFailed"));
    } finally {
      setLoading(false);
    }
    // `t` changes identity on a language switch, and depending on it here would
    // refetch and wipe unsaved edits. This only runs at mount, where the locale
    // is already the cookie's, so the toast is never in a stale language.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = <K extends keyof OrgSettings>(key: K, value: OrgSettings[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  // Parsed, validated rate (positive number) for save + dirty tracking.
  const parsedRate = useMemo(() => {
    const n = Number(rateText);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [rateText]);

  const dirty = useMemo(() => {
    if (!initial || !form) return false;
    return (
      form.validationEnabled !== initial.validationEnabled ||
      form.strictDuplicateDetection !== initial.strictDuplicateDetection ||
      form.autoAcceptReview !== initial.autoAcceptReview ||
      (parsedRate !== null && parsedRate !== initial.usdToEgpRate)
    );
  }, [initial, form, parsedRate]);

  const save = async () => {
    if (!form || !dirty) return;
    if (parsedRate === null) {
      toast.error(t("settings.form.rateInvalid"));
      return;
    }
    setSaving(true);
    try {
      const saved = await updateSettings({
        validationEnabled: form.validationEnabled,
        strictDuplicateDetection: form.strictDuplicateDetection,
        autoAcceptReview: form.autoAcceptReview,
        usdToEgpRate: parsedRate,
      });
      setInitial(saved);
      setForm(saved);
      setRateText(String(saved.usdToEgpRate));
      toast.success(t("settings.toast.saved"));
    } catch {
      toast.error(t("errors.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    if (!initial) return;
    setForm(initial);
    setRateText(String(initial.usdToEgpRate));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={t("settings.title")}
        description={t("settings.description")}
      />

      {/* Language & region — per-user, applied immediately. Deliberately NOT part
          of the organization-wide save/discard flow below. */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="size-4 text-interactive" />
            {t("settings.language.title")}
          </CardTitle>
          <CardDescription>
            {t("settings.language.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingRow
            title={t("settings.language.displayLanguage")}
            description={t("settings.language.displayLanguageDescription")}
          >
            <LanguageSwitcher />
          </SettingRow>
        </CardContent>
      </Card>

      {loading && (
        <p className="type-body-01 text-text-secondary">{t("common.loading")}</p>
      )}

      {!loading && !form && (
        <div className="flex items-center justify-between gap-4 rounded-md border border-border-subtle bg-layer px-3 py-2">
          <p className="type-label-01 text-text-secondary">
            {t("errors.loadFailed")}
          </p>
          <Button variant="ghost" onClick={load}>
            {t("common.retry")}
          </Button>
        </div>
      )}

      {form && (
        <>
          {!canEdit && (
            <p className="rounded-md border border-border-subtle bg-layer px-3 py-2 type-label-01 text-text-secondary">
              {t("common.readOnlyAccess")} {t("common.askAdministrator")}
            </p>
          )}

          {/* Document processing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-interactive" />
                {t("settings.processing.title")}
              </CardTitle>
              <CardDescription>
                {t("settings.processing.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border-subtle py-0">
              <SettingRow
                title={t("settings.processing.validation")}
                description={t("settings.processing.validationDescription")}
              >
                <Toggle
                  label={t("settings.processing.validation")}
                  checked={form.validationEnabled}
                  disabled={!canEdit}
                  onChange={(v) => set("validationEnabled", v)}
                />
              </SettingRow>
              <SettingRow
                title={t("settings.processing.strictDuplicates")}
                description={t("settings.processing.strictDuplicatesDescription")}
              >
                <Toggle
                  label={t("settings.processing.strictDuplicates")}
                  checked={form.strictDuplicateDetection}
                  disabled={!canEdit}
                  onChange={(v) => set("strictDuplicateDetection", v)}
                />
              </SettingRow>
              <SettingRow
                title={t("settings.processing.autoAccept")}
                description={t("settings.processing.autoAcceptDescription")}
              >
                <Toggle
                  label={t("settings.processing.autoAccept")}
                  checked={form.autoAcceptReview}
                  disabled={!canEdit}
                  onChange={(v) => set("autoAcceptReview", v)}
                />
              </SettingRow>
            </CardContent>
          </Card>

          {/* Cost & currency */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="size-4 text-support-caution" />
                {t("settings.currency.title")}
              </CardTitle>
              <CardDescription>
                {t("settings.currency.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingRow
                title={t("settings.currency.rate")}
                description={t("settings.currency.rateDescription")}
              >
                <div className="flex items-center gap-2">
                  <span className="type-label-01 text-text-secondary">
                    {t("settings.currency.rateFrom")}
                  </span>
                  <Input
                    type="number"
                    min={0}
                    step="0.0001"
                    inputMode="decimal"
                    aria-label={t("settings.currency.rateAriaLabel")}
                    disabled={!canEdit}
                    value={rateText}
                    onChange={(e) => setRateText(e.target.value)}
                    className={cn(
                      "w-28 text-end",
                      parsedRate === null && "border-support-error",
                    )}
                  />
                  <span className="type-label-01 text-text-secondary">
                    {t("settings.currency.rateTo")}
                  </span>
                </div>
              </SettingRow>
            </CardContent>
          </Card>

          {/* Save bar */}
          {canEdit && (
            <div className="flex items-center justify-end gap-2">
              {dirty && (
                <Button variant="ghost" onClick={reset} disabled={saving}>
                  {t("common.discard")}
                </Button>
              )}
              <Button onClick={save} disabled={!dirty || saving}>
                <Save className="size-4" />
                {saving ? t("common.saving") : t("common.saveChanges")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
