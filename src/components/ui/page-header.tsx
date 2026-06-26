import * as React from "react";

import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Right-aligned actions (buttons, links). */
  children?: React.ReactNode;
  className?: string;
}

/**
 * Carbon page title block: heading-04 title, secondary description, one primary
 * action area on the right. See design/09 §1.
 */
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
        <h1 className="type-heading-04 text-text-primary">{title}</h1>
        {description && (
          <p className="max-w-2xl type-body-01 text-text-secondary">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex flex-shrink-0 items-center gap-2">{children}</div>
      )}
    </div>
  );
}
