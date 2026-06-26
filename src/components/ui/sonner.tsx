"use client";

import { Toaster as Sonner } from "sonner";

/**
 * Carbon-style toasts: light surface, subtle border, status accent via richColors.
 * Top-right, status icon + text. See design/08 §10.
 */
function Toaster(props: React.ComponentProps<typeof Sonner>) {
  return (
    <Sonner
      className="toaster group"
      position="top-right"
      richColors
      toastOptions={{
        classNames: {
          toast:
            "group toast rounded-md border border-border-subtle bg-card text-text-primary shadow-lg",
          description: "text-text-secondary",
          actionButton: "bg-interactive text-text-on-color",
          cancelButton: "bg-layer text-text-secondary",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
