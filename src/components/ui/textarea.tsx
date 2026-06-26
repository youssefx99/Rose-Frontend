import * as React from "react";

import { cn } from "@/lib/utils";

/** Carbon-style multiline field — matches Input styling. See design/08 §5. */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-md border border-border-strong bg-field px-3 py-2 text-sm text-text-primary outline-none transition-colors duration-[var(--dur-fast-01)]",
        "placeholder:text-text-placeholder hover:bg-field-hover",
        "focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-0",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-support-error aria-invalid:ring-2 aria-invalid:ring-support-error/40",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
