import Link from "next/link"
import { ArrowLeft, BadgePercent, MapPin, MousePointerClick, Radio, ShieldCheck, Zap } from "lucide-react"
import { HeaderMenu } from "@/components/header-menu"
import { BottomNav } from "@/components/bottom-nav"
import { AffiliateModule } from "@/components/affiliate-module"

const packages = [
  {
    name: "Nearby Sponsored Card",
    fit: "Bars and restaurants that want fans within a radius tonight",
    proof: "Appears in Places to Watch as a sponsored venue card",
    icon: MapPin,
  },
  {
    name: "Match Night Offer",
    fit: "Happy hour, table booking, big-screen events and walk-ins",
    proof: "Runs beside venue lists and event/watch flows",
    icon: BadgePercent,
  },
  {
    name: "Push Campaign",
    fit: "Location, team, sport or venue-interest targeting",
    proof: "Campaign can deep-link to venue, offer or event pages",
    icon: Radio,
  },
]

export default function VenueAdvertisePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <HeaderMenu />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4">
        <Link
          href="/venues"
          className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Places to Watch
        </Link>

        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <Zap className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold leading-tight">Advertise to Sports Fans Nearby</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Sponsored venue cards, match-night offers and local push campaigns give bars and restaurants a direct route to fans who are looking for somewhere to watch now.
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {packages.map((pkg) => {
            const Icon = pkg.icon
            return (
              <article key={pkg.name} className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <h2 className="text-sm font-bold">{pkg.name}</h2>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{pkg.fit}</p>
                <p className="mt-3 rounded-xl bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
                  {pkg.proof}
                </p>
              </article>
            )
          })}
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-bold">Launch Acceptance</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {[
              ["Sponsored disclosure", "Every paid placement is labelled."],
              ["Click tracking", "Campaigns can report venue intent and outbound clicks."],
              ["Owner workflow", "Sales can hand campaigns to Strapi/admin when access is live."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-xl border border-border bg-muted/40 p-3">
                <ShieldCheck className="mb-2 h-4 w-4 text-primary" aria-hidden="true" />
                <p className="text-xs font-semibold">{title}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/venues/owner-signup"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <MousePointerClick className="h-4 w-4" aria-hidden="true" />
            Start Venue Signup
          </Link>
          <Link
            href="/admin/campaigns"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold hover:bg-accent"
          >
            Campaign Admin
          </Link>
        </div>

        <AffiliateModule context="watch" title="Commercial flows" />
      </main>
      <BottomNav />
    </div>
  )
}
