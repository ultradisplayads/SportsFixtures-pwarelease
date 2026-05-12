import Link from "next/link"
import { Cookie, Settings, Shield } from "lucide-react"

import { BottomNav } from "@/components/bottom-nav"
import { HeaderMenu } from "@/components/header-menu"

export default function CookiePolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <HeaderMenu />
      <main className="flex-1 p-4">
        <div className="mb-5 rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 inline-flex rounded-xl bg-primary/10 p-2 text-primary">
            <Cookie className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold">Cookie Policy</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            SportsFixtures uses essential storage for the app to work, plus preference, analytics,
            personalisation, venue, and commercial measurement where allowed by our terms and privacy policy.
          </p>
        </div>

        <div className="space-y-3">
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold">What is always required</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Login sessions, security checks, app preferences, favourites, onboarding state, and PWA offline
                  storage are used so the app can function reliably.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold">Preferences and controls</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  You can manage privacy, consent, location-aware features, notifications, and account data inside settings.
                </p>
                <Link href="/settings" className="mt-3 inline-flex text-sm font-bold text-primary">
                  Open settings
                </Link>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link href="/privacy" className="rounded-xl border border-border bg-card px-4 py-3 text-center text-sm font-bold">
            Privacy
          </Link>
          <Link href="/terms" className="rounded-xl border border-border bg-card px-4 py-3 text-center text-sm font-bold">
            Terms
          </Link>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
