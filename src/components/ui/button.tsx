import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Carbon-style button. Heights snap to the Carbon ladder (sm 32 / md 40 / lg 48).
 * Primary = rose brand (--interactive); secondary = Carbon gray-80; destructive =
 * Carbon danger red. Focus = 2px brand ring (Carbon focus spec). See design/08.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-[var(--dur-fast-02)] ease-[var(--ease-standard)] outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-interactive text-text-on-color hover:bg-interactive-hover active:bg-interactive-active",
        // Brand alias (kept for back-compat) — same as default primary.
        rose: "bg-interactive text-text-on-color hover:bg-interactive-hover active:bg-interactive-active",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[var(--secondary-hover)] active:bg-[var(--secondary-active)]",
        destructive:
          "bg-support-error text-white hover:bg-[var(--danger-hover)] active:bg-[var(--danger-active)]",
        outline:
          "border border-border-strong bg-transparent text-text-primary hover:bg-layer active:bg-layer-selected",
        ghost: "text-text-primary hover:bg-layer active:bg-layer-selected",
        link: "text-link underline-offset-4 hover:text-link-hover hover:underline",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 gap-1.5 px-3 text-xs has-[>svg]:px-2.5",
        lg: "h-12 px-5",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
