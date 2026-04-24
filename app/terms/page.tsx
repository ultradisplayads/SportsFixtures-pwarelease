import { HeaderMenu } from "@/components/header-menu"
import { BottomNav } from "@/components/bottom-nav"

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <HeaderMenu />
      <main className="flex-1 p-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h1 className="text-2xl font-bold">Terms of Service</h1>
          <p className="mt-2 text-sm text-muted-foreground">By using Sports Fixtures, you agree to use the service lawfully and responsibly.</p>
          <div className="mt-6 space-y-6 text-sm leading-6 text-muted-foreground">
            <section>
              <h2 className="mb-2 text-base font-semibold text-foreground">Service availability</h2>
              <p>We aim to provide a reliable service, but live data, schedules, venues, and listings may change or be delayed.</p>
            </section>
            <section>
              <h2 className="mb-2 text-base font-semibold text-foreground">Accounts</h2>
              <p>You are responsible for keeping your sign-in details secure and for activity that occurs under your account.</p>
            </section>
            <section>
              <h2 className="mb-2 text-base font-semibold text-foreground">Content and data</h2>
              <p>Fixtures, scores, venue information, and related content may come from internal and third-party sources. We cannot guarantee all data is error-free at all times.</p>
            </section>
            <section>
              <h2 className="mb-2 text-base font-semibold text-foreground">Paid features</h2>
              <p>Any paid plans, entitlements, or ad-free features must follow the billing and access rules shown at the time of purchase or activation.</p>
            </section>
            <section>
              <h2 className="mb-2 text-base font-semibold text-foreground">Changes</h2>
              <p>We may update features, plans, routes, and service rules from time to time as the platform grows.</p>
            </section>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
