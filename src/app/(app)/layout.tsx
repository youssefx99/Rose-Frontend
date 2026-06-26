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
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  ShieldCheck,
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
  { href: "/documents", label: "Upload", icon: Upload, perm: "documents.view" },
  { href: "/review", label: "Review Queue", icon: Inbox, showBadge: true, perm: "review.view" },
  { href: "/remittances", label: "Remittances", icon: Receipt, perm: "remittances.view" },
];

// SUPER_ADMIN-only administration links.
const ADMIN_NAV = [
  { href: "/users", label: "Users", icon: ShieldCheck },
  { href: "/permissions", label: "Permissions", icon: KeyRound },
];

const COLLAPSE_KEY = "rose-sidebar-collapsed";

type NavItem = {
  href: string;
  label: string;
  icon: typeof FileText;
  showBadge?: boolean;
  perm?: string;
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout, can } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  // Restore + persist the collapse preference (avoids SSR hydration mismatch).
  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  };

  // Live pending-review count for the rose sidebar badge; refreshes on nav.
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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-zinc-500">
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
          className={cn(
            "relative flex items-center gap-3 border-l-2 py-2 text-sm font-medium transition-colors",
            collapsed ? "justify-center px-0" : "px-4",
            active
              ? "border-rose-500 bg-slate-800 text-white"
              : "border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200",
          )}
        >
          <Icon className="size-4 shrink-0" />
          {!collapsed && <span className="flex-1">{label}</span>}
          {hasBadge &&
            (collapsed ? (
              <span className="absolute right-3 top-1.5 size-2 rounded-full bg-rose-500" />
            ) : (
              <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-xs font-semibold text-white tabular-nums">
                {pendingCount}
              </span>
            ))}
        </Link>
      );
    });

  const initial = user.email.charAt(0).toUpperCase();
  const name = user.email.split("@")[0];

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <aside
        className={cn(
          "hidden shrink-0 flex-col bg-slate-900 transition-[width] duration-200 md:flex",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div
          className={cn(
            "flex items-center py-5",
            collapsed ? "justify-center px-0" : "justify-between px-5",
          )}
        >
          {!collapsed && (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-base font-semibold tracking-tight text-white"
            >
              <span className="inline-block size-2 rounded-full bg-rose-500" />
              RoseSystem
            </Link>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </button>
        </div>

        <nav className="flex-1 space-y-1 py-2">
          {renderNav(PRIMARY_NAV)}
          <div className="mx-4 my-3 border-t border-slate-700" />
          {renderNav(INGESTION_NAV)}
          {user.role === "SUPER_ADMIN" && (
            <>
              <div className="mx-4 my-3 border-t border-slate-700" />
              {renderNav(ADMIN_NAV)}
            </>
          )}
        </nav>

        <div className="border-t border-slate-700 p-3">
          <div
            className={cn(
              "flex items-center gap-3 py-2",
              collapsed ? "flex-col px-0" : "px-1",
            )}
          >
            <div
              title={collapsed ? `${name} · ${user.role}` : undefined}
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-white"
            >
              {initial}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{name}</p>
                <p className="truncate text-xs uppercase tracking-wider text-slate-400">
                  {user.role}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={logout}
              title="Sign out"
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
