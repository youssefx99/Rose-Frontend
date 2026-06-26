import * as React from "react";

import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Right-aligned actions (buttons, links). */
  children?: React.ReactNode;
  className?: string;
}

/** Consistent page title block: balanced heading, muted description, actions. */
export function PageHeader({
  title,
  description,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-x-4 gap-y-3",
        className,
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-sm text-zinc-500">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex flex-shrink-0 items-center gap-2">{children}</div>
      )}
    </div>
  );
}
