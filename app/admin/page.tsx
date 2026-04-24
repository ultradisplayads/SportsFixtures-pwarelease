"use client"

// app/admin/page.tsx
// Section 12.A — Operator admin index.
// Provides a real, discoverable entry path to all control-plane surfaces.
// No mock data, no fake UI — all links go to real routes.

import Link from "next/link"
import {
  ArrowLeft, LayoutDashboard, Radio, Trophy, Flag, Tag, MapPin, Bell,
  ChevronRight,
} from "lucide-react"
import { LogoBadge } from "@/components/logo-badge"

const ADMIN_SECTIONS = [
  {
    href: "/admin/control-plane",
    icon: LayoutDashboard,
    title: "Control Plane",
    description: "Homepage modules, ticker, tournament mode, feature flags — full snapshot",
  },
  {
    href: "/admin/control-plane#homepage-modules",
    icon: LayoutDashboard,
    title: "Homepage Modules",
    description: "Inspect which modules are enabled, disabled, and their current order",
  },
  {
    href: "/admin/control-plane#ticker",
    icon: Radio,
    title: "Ticker Settings",
    description: "Live scores rail, secondary content rail, enabled content types",
  },
  {
    href: "/admin/control-plane#tournament",
    icon: Trophy,
    title: "Tournament Mode",
    description: "World Cup / tournament state, stage, hero/nav/ticker boost flags",
  },
  {
    href: "/admin/control-plane#feature-flags",
    icon: Flag,
    title: "Feature Flags",
    description: "All active feature flags and their current enabled state",
  },
  {
    href: "/admin/control-plane#commercial",
    icon: Tag,
    title: "Commercial Slots",
    description: "Geo-ad slots, sponsor slots, and commercial content config",
  },
  {
    href: "/admin/control-plane#venue-boosts",
    icon: MapPin,
    title: "Venue Boosts",
    description: "Sponsored/boosted venue rules and their event/competition scope",
  },
  {
    href: "/admin/push",
    icon: Bell,
    title: "Push Notifications",
    description: "Compose and send targeted push notifications to users",
  },
]

export default function AdminIndexPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-sidebar px-4 py-3">
        <Link href="/" className="text-sidebar-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <LogoBadge size={28} linked={false} />
        <div>
          <h1 className="text-sm font-bold text-sidebar-foreground">Admin</h1>
          <p className="text-[10px] text-sidebar-foreground/60">Operator Dashboard</p>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-3 p-4">
        <p className="text-xs text-muted-foreground pt-2">
          Internal operator tools. These views are read-only inspection surfaces — changes are made via the CMS.
        </p>

        {ADMIN_SECTIONS.map((section) => {
          const Icon = section.icon
          return (
            <Link
              key={section.href}
              href={section.href}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent active:scale-[0.98]"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{section.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
