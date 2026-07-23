"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A left-sliding, focus-trapped, Escape-to-close navigation drawer for small viewports, built on
 * Radix Dialog (which already provides focus trapping and Escape handling — see docs/ACCESSIBILITY.md).
 *
 * `children` must be plain JSX (e.g. `<CitizenNav locale={locale} />`), not a render-prop function:
 * this component is rendered from a Server Component layout, and a raw JS function cannot cross
 * the server/client serialization boundary as a prop. To let nav links auto-close the drawer on
 * click, nav components read the close handler from `useMobileNavClose()` instead of receiving it
 * as a prop — that keeps everything passed from the server layout fully serializable.
 */
const MobileNavCloseContext = React.createContext<() => void>(() => {});

export function useMobileNavClose() {
  return React.useContext(MobileNavCloseContext);
}

export function MobileNavDrawer({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="Open navigation menu"
          className="flex h-11 w-11 items-center justify-center rounded-md border border-border md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex h-full w-72 max-w-[85vw] flex-col bg-card shadow-lg",
            "data-[state=open]:animate-in data-[state=open]:slide-in-from-left"
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <DialogPrimitive.Title className="font-semibold text-primary">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <button type="button" aria-label="Close navigation menu" className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </DialogPrimitive.Close>
          </div>
          <div className="flex-1 overflow-y-auto">
            <MobileNavCloseContext.Provider value={close}>{children}</MobileNavCloseContext.Provider>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
