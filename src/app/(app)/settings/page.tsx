"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Save, Coins } from "lucide-react";

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
          checked ? "translate-x-[22px]" : "translate-x-0.5",
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
      toast.error("Failed to load settings.");
    } finally {
      setLoading(false);
    }
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
      (parsedRate !== null && parsedRate !== initial.usdToEgpRate)
    );
  }, [initial, form, parsedRate]);

  const save = async () => {
    if (!form || !dirty) return;
    if (parsedRate === null) {
      toast.error("Exchange rate must be a positive number.");
      return;
    }
    setSaving(true);
    try {
      const saved = await updateSettings({
        validationEnabled: form.validationEnabled,
        strictDuplicateDetection: form.strictDuplicateDetection,
        usdToEgpRate: parsedRate,
      });
      setInitial(saved);
      setForm(saved);
      setRateText(String(saved.usdToEgpRate));
      toast.success("Settings saved.");
    } catch {
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    if (!initial) return;
    setForm(initial);
    setRateText(String(initial.usdToEgpRate));
  };

  if (loading || !form) {
    return <p className="type-body-01 text-text-secondary">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Settings"
        description="Organization-wide system behavior. Changes apply to everyone."
      />

      {!canEdit && (
        <p className="rounded-md border border-border-subtle bg-layer px-3 py-2 type-label-01 text-text-secondary">
          You have read-only access. Ask an administrator to change these settings.
        </p>
      )}

      {/* Document processing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-interactive" />
            Document processing
          </CardTitle>
          <CardDescription>
            How uploaded EOBs are checked before they reach the review queue.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border-subtle py-0">
          <SettingRow
            title="AI validation layer"
            description="Run a fast AI quality check after extraction. Surfaces a 0–100 score and field-level flags on the review page. Disabling skips the check (and its cost)."
          >
            <Toggle
              label="AI validation layer"
              checked={form.validationEnabled}
              disabled={!canEdit}
              onChange={(v) => set("validationEnabled", v)}
            />
          </SettingRow>
          <SettingRow
            title="Strict duplicate detection"
            description="In addition to the content fingerprint, also block re-uploading a file with the same name, size, and type. Turn off to rely on content hash only."
          >
            <Toggle
              label="Strict duplicate detection"
              checked={form.strictDuplicateDetection}
              disabled={!canEdit}
              onChange={(v) => set("strictDuplicateDetection", v)}
            />
          </SettingRow>
        </CardContent>
      </Card>

      {/* Cost & currency */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="size-4 text-support-caution" />
            Cost &amp; currency
          </CardTitle>
          <CardDescription>
            Controls how AI extraction cost is shown to reviewers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingRow
            title="USD → EGP exchange rate"
            description="1 US dollar equals this many Egyptian pounds. Used to convert the per-document AI cost shown on the review screen."
          >
            <div className="flex items-center gap-2">
              <span className="type-label-01 text-text-secondary">1 USD =</span>
              <Input
                type="number"
                min={0}
                step="0.0001"
                inputMode="decimal"
                aria-label="USD to EGP exchange rate"
                disabled={!canEdit}
                value={rateText}
                onChange={(e) => setRateText(e.target.value)}
                className={cn(
                  "w-28 text-right",
                  parsedRate === null && "border-support-error",
                )}
              />
              <span className="type-label-01 text-text-secondary">EGP</span>
            </div>
          </SettingRow>
        </CardContent>
      </Card>

      {/* Save bar */}
      {canEdit && (
        <div className="flex items-center justify-end gap-2">
          {dirty && (
            <Button variant="ghost" onClick={reset} disabled={saving}>
              Discard
            </Button>
          )}
          <Button onClick={save} disabled={!dirty || saving}>
            <Save className="size-4" />
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      )}
    </div>
  );
}
