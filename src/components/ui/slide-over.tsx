"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type SlideOverSize = "default" | "wide";

// Default 480px; wide 640px for complex forms. Full width on mobile.
const WIDTH: Record<SlideOverSize, string> = {
  default: "sm:max-w-[480px]",
  wide: "sm:max-w-[640px]",
};

interface SlideOverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  size?: SlideOverSize;
  /** Sticky action bar pinned to the bottom (right-aligned buttons). */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Right-side slide-over panel (Carbon side-panel pattern). Built on Radix Dialog
 * (overlay, Esc, click-outside, focus trap), 400ms entrance/exit. See design/08 §8.
 */
export function SlideOver({
  open,
  onOpenChange,
  title,
  description,
  size = "default",
  footer,
  children,
}: SlideOverProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-[var(--overlay)]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        />
        <DialogPrimitive.Content
          {...(description ? {} : { "aria-describedby": undefined })}
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex h-screen w-screen flex-col bg-card shadow-2xl outline-none",
            "duration-[var(--dur-slow-01)] data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
            WIDTH[size],
          )}
        >
          <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
            <div className="min-w-0">
              <DialogPrimitive.Title className="type-heading-02 text-text-primary">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="mt-0.5 truncate type-body-01 text-text-secondary">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              aria-label="Close"
              className="rounded-sm p-1.5 text-icon-secondary transition-colors hover:bg-layer-hover hover:text-icon-primary focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
            >
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-6">{children}</div>

          {footer && (
            <div className="flex justify-end gap-2 border-t border-border-subtle bg-layer p-4">
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
