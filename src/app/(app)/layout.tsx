"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  FileSpreadsheet,
  FileText,
  Inbox,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Receipt,
  Settings,
  ShieldCheck,
  Sun,
  Upload,
  Users,
} from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { listReviewQueue } from "@/lib/documents";
import { useFormat } from "@/lib/i18n/format";
import { useT } from "@/lib/i18n/provider";
import { roleLabelKey } from "@/lib/users";
import { cn } from "@/lib/utils";

const PRIMARY_NAV = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard, perm: "dashboard.view" },
  { href: "/claims", labelKey: "nav.claims", icon: FileText, perm: "claims.view" },
  { href: "/clients", labelKey: "nav.clients", icon: Users, perm: "clients.view" },
  { href: "/payers", labelKey: "nav.payers", icon: Building2, perm: "payers.view" },
];

const INGESTION_NAV = [
  { href: "/documents", labelKey: "nav.documents", icon: Upload, perm: "documents.view" },
  { href: "/import", labelKey: "nav.import", icon: FileSpreadsheet, perm: "claims.create" },
  { href: "/review", labelKey: "nav.review", icon: Inbox, showBadge: true, perm: "review.view" },
  { href: "/remittances", labelKey: "nav.remittances", icon: Receipt, perm: "remittances.view" },
];

// Administration links. Users/Permissions are SUPER_ADMIN-only; Settings is
// permission-gated so ADMINs with settings.view see it too.
const ADMIN_NAV: NavItem[] = [
  { href: "/users", labelKey: "nav.users", icon: ShieldCheck, superAdminOnly: true },
  { href: "/permissions", labelKey: "nav.permissions", icon: KeyRound, superAdminOnly: true },
  { href: "/settings", labelKey: "nav.settings", icon: Settings, perm: "settings.view" },
];

const COLLAPSE_KEY = "rose-sidebar-collapsed";
const THEME_KEY = "rose-theme";

type NavItem = {
  href: string;
  labelKey: string;
  icon: typeof FileText;
  showBadge?: boolean;
  perm?: string;
  superAdminOnly?: boolean;
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout, can } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const t = useT("nav");
  const { formatNumber } = useFormat();
  const [pendingCount, setPendingCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  // Restore preferences (avoids SSR hydration mismatch).
  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    const theme = localStorage.getItem(THEME_KEY);
    const isDark = theme === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  };

  const toggleTheme = () => {
    setDark((prev) => {
      const next = !prev;
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  };

  // Live pending-review count for the sidebar badge; refreshes on nav.
  const refreshPending = useCallback(async () => {
    if (!user) return;
    try {
      const queue = await listReviewQueue();
      setPendingCount(queue.reduce((sum, job) => sum + job.counts.pending, 0));
    } catch {
      // non-fatal — badge simply stays hidden
    }
  }, [user]);

  useEffect(() => {
    refreshPending();
  }, [refreshPending, pathname]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background type-body-01 text-text-secondary">
        {t("common.loading")}
      </div>
    );
  }

  const renderNav = (items: NavItem[]) =>
    items
      .filter(
        ({ perm, superAdminOnly }) =>
          (!superAdminOnly || user.role === "SUPER_ADMIN") &&
          (!perm || can(perm)),
      )
      .map(({ href, labelKey, icon: Icon, showBadge }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        const hasBadge = showBadge && pendingCount > 0;
        const label = t(labelKey);
        return (
          <Link
            key={href}
            href={href}
            title={collapsed ? label : undefined}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex items-center gap-3 border-s-[3px] py-2.5 type-body-compact-01 transition-colors duration-[var(--dur-fast-02)]",
              collapsed ? "justify-center px-0" : "px-4",
              active
                ? "border-interactive bg-layer-selected font-semibold text-text-primary"
                : "border-transparent text-text-secondary hover:bg-layer-hover hover:text-text-primary",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {!collapsed && <span className="flex-1">{label}</span>}
            {hasBadge &&
              (collapsed ? (
                <span className="absolute top-2 end-2.5 size-2 rounded-full bg-interactive" />
              ) : (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-interactive px-1.5 type-label-01 font-semibold tabular-nums text-text-on-color">
                  {formatNumber(pendingCount)}
                </span>
              ))}
          </Link>
        );
      });

  const initial = user.email.charAt(0).toUpperCase();
  const name = user.email.split("@")[0];
  const role = t(roleLabelKey(user.role));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Carbon UI Shell header (dark, 48px) ── */}
      <header className="sticky top-0 z-40 flex h-12 shrink-0 items-center gap-2 border-b border-border-subtle bg-background pe-3 ps-1 text-text-primary dark:border-transparent dark:bg-[var(--cds-gray-100)] dark:text-white">
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? t("expandNavigation") : t("collapseNavigation")}
          className="hidden size-12 items-center justify-center text-text-secondary transition-colors hover:bg-layer-hover hover:text-text-primary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-interactive focus-visible:outline-none dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-white md:inline-flex"
        >
          <Menu className="size-5" />
        </button>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-2 type-heading-compact-02 tracking-tight text-text-primary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-interactive focus-visible:outline-none dark:text-white dark:focus-visible:ring-white"
        >
          <span className="inline-block size-2 rounded-full bg-interactive" />
          {t("common.appName")}
        </Link>

        <span className="ms-auto" />

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={dark ? t("switchToLightTheme") : t("switchToDarkTheme")}
          title={dark ? t("lightTheme") : t("darkTheme")}
          className="inline-flex size-9 items-center justify-center rounded-sm text-text-secondary transition-colors hover:bg-layer-hover hover:text-text-primary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-interactive focus-visible:outline-none dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-white"
        >
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>

        <div className="flex items-center gap-2 ps-1">
          <div
            title={`${name} · ${role}`}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-interactive type-label-01 font-semibold text-text-on-color"
          >
            {initial}
          </div>
          <div className="hidden min-w-0 leading-tight sm:block">
            <p className="truncate type-label-01 font-medium text-text-primary dark:text-white">{name}</p>
            <p className="truncate type-label-01 text-text-secondary dark:text-white/60">{role}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            title={t("signOut")}
            aria-label={t("signOut")}
            className="inline-flex size-9 items-center justify-center rounded-sm text-text-secondary transition-colors hover:bg-layer-hover hover:text-text-primary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-interactive focus-visible:outline-none dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-white"
          >
            <LogOut className="size-4 rtl:-scale-x-100" />
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* ── Left side nav (light, collapsible) ── */}
        <aside
          className={cn(
            "sticky top-12 hidden h-[calc(100vh-3rem)] shrink-0 flex-col border-e border-border-subtle bg-background transition-[width] duration-[var(--dur-moderate-01)] md:flex",
            collapsed ? "w-14" : "w-60",
          )}
        >
          <nav className="flex-1 overflow-y-auto py-2">
            {renderNav(PRIMARY_NAV)}
            <div className="mx-4 my-2 border-t border-border-subtle" />
            {renderNav(INGESTION_NAV)}
            {(user.role === "SUPER_ADMIN" || can("settings.view")) && (
              <>
                <div className="mx-4 my-2 border-t border-border-subtle" />
                {renderNav(ADMIN_NAV)}
              </>
            )}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
