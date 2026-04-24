"use client"

// components/admin/control-plane-shell.tsx
// Section 12.A — Outer chrome for admin control-plane inspection pages.
//
// Provides the sticky header (back-link, title, subtitle, action slot) and
// the centered content column. All admin control-plane pages use this shell.

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { LogoBadge } from "@/components/logo-badge"

type Props = {
  title: string
  subtitle?: string
  backHref?: string
  /** Slot for header-level actions (e.g. Refresh button). */
  actions?: React.ReactNode
  children: React.ReactNode
}

export function ControlPlaneShell({
  title,
  subtitle = "Live snapshot — read only",
  backHref = "/admin",
  actions,
  children,
}: Props) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-sidebar px-4 py-3">
        <Link href={backHref} className="text-sidebar-foreground">
          <ArrowLeft className="h-5 w-5" aria-label="Back" />
        </Link>
        <LogoBadge size={28} linked={false} />
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-sidebar-foreground">{title}</h1>
          {subtitle && (
            <p className="text-[10px] text-sidebar-foreground/60">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>

      <div className="mx-auto max-w-2xl space-y-4 p-4 pb-10">
        {children}
      </div>
    </div>
  )
}
