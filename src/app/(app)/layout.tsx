"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  FileText,
  Inbox,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Receipt,
  ShieldCheck,
  Sun,
  Upload,
  Users,
} from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { listReviewQueue } from "@/lib/documents";
import { cn } from "@/lib/utils";

const PRIMARY_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, perm: "dashboard.view" },
  { href: "/claims", label: "Claims", icon: FileText, perm: "claims.view" },
  { href: "/clients", label: "Clients", icon: Users, perm: "clients.view" },
  { href: "/payers", label: "Payers", icon: Building2, perm: "payers.view" },
];

const INGESTION_NAV = [
  { href: "/documents", label: "Documents", icon: Upload, perm: "documents.view" },
  { href: "/review", label: "Review Queue", icon: Inbox, showBadge: true, perm: "review.view" },
  { href: "/remittances", label: "Remittances", icon: Receipt, perm: "remittances.view" },
];

// SUPER_ADMIN-only administration links.
const ADMIN_NAV = [
  { href: "/users", label: "Users", icon: ShieldCheck },
  { href: "/permissions", label: "Permissions", icon: KeyRound },
];

const COLLAPSE_KEY = "rose-sidebar-collapsed";
const THEME_KEY = "rose-theme";

type NavItem = {
  href: string;
  label: string;
  icon: typeof FileText;
  showBadge?: boolean;
  perm?: string;
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout, can } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
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
        Loading…
      </div>
    );
  }

  const renderNav = (items: NavItem[]) =>
    items
      .filter(({ perm }) => !perm || can(perm))
      .map(({ href, label, icon: Icon, showBadge }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        const hasBadge = showBadge && pendingCount > 0;
        return (
          <Link
            key={href}
            href={href}
            title={collapsed ? label : undefined}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex items-center gap-3 border-l-[3px] py-2.5 type-body-compact-01 transition-colors duration-[var(--dur-fast-02)]",
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
                <span className="absolute top-2 right-2.5 size-2 rounded-full bg-interactive" />
              ) : (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-interactive px-1.5 type-label-01 font-semibold tabular-nums text-text-on-color">
                  {pendingCount}
                </span>
              ))}
          </Link>
        );
      });

  const initial = user.email.charAt(0).toUpperCase();
  const name = user.email.split("@")[0];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Carbon UI Shell header (dark, 48px) ── */}
      <header className="sticky top-0 z-40 flex h-12 shrink-0 items-center gap-2 bg-[#161616] pr-3 pl-1 text-white">
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          className="hidden size-12 items-center justify-center text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white focus-visible:outline-none md:inline-flex"
        >
          <Menu className="size-5" />
        </button>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-2 type-heading-compact-02 tracking-tight text-white focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white focus-visible:outline-none"
        >
          <span className="inline-block size-2 rounded-full bg-interactive" />
          RoseSystem
        </Link>

        <span className="ml-auto" />

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
          title={dark ? "Light theme" : "Dark theme"}
          className="inline-flex size-9 items-center justify-center rounded-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white focus-visible:outline-none"
        >
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>

        <div className="flex items-center gap-2 pl-1">
          <div
            title={`${name} · ${user.role}`}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-interactive type-label-01 font-semibold text-text-on-color"
          >
            {initial}
          </div>
          <div className="hidden min-w-0 leading-tight sm:block">
            <p className="truncate type-label-01 font-medium text-white">{name}</p>
            <p className="truncate type-label-01 text-white/60">{user.role}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
            className="inline-flex size-9 items-center justify-center rounded-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white focus-visible:outline-none"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* ── Left side nav (light, collapsible) ── */}
        <aside
          className={cn(
            "sticky top-12 hidden h-[calc(100vh-3rem)] shrink-0 flex-col border-r border-border-subtle bg-background transition-[width] duration-[var(--dur-moderate-01)] md:flex",
            collapsed ? "w-14" : "w-60",
          )}
        >
          <nav className="flex-1 overflow-y-auto py-2">
            {renderNav(PRIMARY_NAV)}
            <div className="mx-4 my-2 border-t border-border-subtle" />
            {renderNav(INGESTION_NAV)}
            {user.role === "SUPER_ADMIN" && (
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
