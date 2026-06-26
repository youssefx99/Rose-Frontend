import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Carbon tag: small low-saturation token. Status variants use the fixed support
 * vocabulary (light surface + dark same-hue text). See design/08 §4.
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-full px-2 py-0.5 type-label-01 transition-colors [&>svg]:size-3 [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-interactive text-text-on-color",
        secondary: "bg-layer-selected text-text-primary",
        destructive: "bg-support-error-bg text-support-error",
        success: "bg-support-success-bg text-support-success",
        warning: "bg-support-warning-bg text-text-primary",
        info: "bg-support-info-bg text-support-info",
        outline: "border border-border-subtle-01 text-text-secondary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
