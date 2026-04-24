"use client";

// components/home/home-module-shell.tsx
// Section 07.A — Consistent wrapper for every homepage module.
//
// Rules:
// - Every module rendered by HomeModuleRenderer must be wrapped in this shell.
// - The shell owns the section header (title + optional action link).
// - titleOverride from the control plane is respected here — no other component
//   should need to know about it.
// - If the module has no header, pass title={undefined} and the header is omitted.

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface HomeModuleShellProps {
  /** Module key — used as the DOM id so deep links work (e.g. #calendar). */
  moduleKey: string;
  /** Display title. Omit for modules that have their own full-bleed header. */
  title?: string | null;
  /** Optional right-side action link. */
  actionLabel?: string;
  actionHref?: string;
  /** Extra classes applied to the outer wrapper. */
  className?: string;
  children: ReactNode;
}

export function HomeModuleShell({
  moduleKey,
  title,
  actionLabel,
  actionHref,
  className,
  children,
}: HomeModuleShellProps) {
  return (
    <section
      id={moduleKey}
      aria-label={title ?? moduleKey}
      className={cn("border-b border-border", className)}
    >
      {title && (
        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {actionLabel && actionHref && (
            <Link
              href={actionHref}
              className="text-xs text-primary hover:underline"
            >
              {actionLabel}
            </Link>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
