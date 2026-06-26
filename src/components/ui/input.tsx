import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Carbon-style text field: filled (--field) with a 1px strong border, 40px tall,
 * 14px body-compact text, 2px brand focus ring, red error state on aria-invalid.
 * See design/08 §5.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-md border border-border-strong bg-field px-3 text-sm text-text-primary outline-none transition-colors duration-[var(--dur-fast-01)]",
        "placeholder:text-text-placeholder selection:bg-interactive selection:text-text-on-color",
        "hover:bg-field-hover",
        "focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-0",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-support-error aria-invalid:ring-2 aria-invalid:ring-support-error/40",
        "file:mr-3 file:inline-flex file:h-8 file:items-center file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-text-primary",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
