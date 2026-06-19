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
 * Right-side slide-over panel. Built on the Radix Dialog primitive (overlay,
 * Escape-to-close, click-outside, focus trap) restyled as a flush drawer — never
 * a centered modal. Used app-wide for every form and detail view.
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
            "fixed inset-0 z-50 bg-black/40",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        />
        <DialogPrimitive.Content
          // Avoid the Radix a11y warning when no description is provided.
          {...(description ? {} : { "aria-describedby": undefined })}
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex h-screen w-screen flex-col bg-white shadow-xl outline-none",
            "duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
            WIDTH[size],
          )}
        >
          <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
            <div className="min-w-0">
              <DialogPrimitive.Title className="text-base font-semibold text-zinc-900">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="mt-0.5 truncate text-sm text-zinc-500">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              aria-label="Close"
              className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-6">{children}</div>

          {footer && (
            <div className="flex justify-end gap-2 border-t border-zinc-200 bg-zinc-50 p-4">
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
