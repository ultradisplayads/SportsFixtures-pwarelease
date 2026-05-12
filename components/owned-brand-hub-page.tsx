"use client"

import Link from "next/link"
import { ArrowLeft, Beef, CheckCircle2, ExternalLink, MapPin, ShieldCheck, Trophy, Tv } from "lucide-react"
import { LogoBadge } from "@/components/logo-badge"
import { ownedBrandHubHighlights, type OwnedBrandHub } from "@/lib/owned-brand-hubs"

const HUB_ICONS = {
  food: Beef,
  map: MapPin,
  trophy: Trophy,
  tv: Tv,
}

export function OwnedBrandHubPage({ hub }: { hub: OwnedBrandHub }) {
  const Icon = HUB_ICONS[hub.iconKey]

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-sidebar px-4 py-3">
        <Link href="/" className="text-sidebar-foreground" aria-label="Back to SportsFixtures">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <LogoBadge size={28} linked={false} />
        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold text-sidebar-foreground">{hub.name}</h1>
          <p className="truncate text-[10px] text-sidebar-foreground/60">{hub.domain}</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 p-4 pb-24">
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-3 text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold">{hub.name}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{hub.positioning}</p>
              <p className="mt-3 text-sm leading-6">{hub.audience}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <Link
              href={hub.primaryHref}
              className="rounded-md bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground"
            >
              {hub.primaryCta}
            </Link>
            <Link
              href={hub.secondaryHref}
              className="rounded-md border border-border px-4 py-3 text-center text-sm font-semibold"
            >
              {hub.secondaryCta}
            </Link>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {ownedBrandHubHighlights.map((item) => {
            const ItemIcon = HUB_ICONS[item.iconKey]
            return (
              <div key={item.label} className="rounded-lg border border-border bg-card p-4">
                <ItemIcon className="h-5 w-5 text-primary" />
                <p className="mt-3 text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-semibold">{item.value}</p>
              </div>
            )
          })}
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            <h3 className="font-bold">Verified Local Proof</h3>
          </div>
          <div className="space-y-2">
            {hub.proof.map((item) => (
              <div key={item} className="flex gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-5">
          <h3 className="font-bold">Launch Gaps</h3>
          <div className="mt-3 space-y-2">
            {hub.launchGaps.map((item) => (
              <div key={item} className="flex gap-2 text-sm">
                <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
