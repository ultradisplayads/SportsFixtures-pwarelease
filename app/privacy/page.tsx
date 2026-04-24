import { HeaderMenu } from "@/components/header-menu"
import { BottomNav } from "@/components/bottom-nav"

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <HeaderMenu />
      <main className="flex-1 p-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h1 className="text-2xl font-bold">Privacy Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sports Fixtures stores the minimum app data needed to run favourites, notifications, and account features.</p>
          <div className="mt-6 space-y-6 text-sm leading-6 text-muted-foreground">
            <section>
              <h2 className="mb-2 text-base font-semibold text-foreground">What we store</h2>
              <p>We may store favourites, app preferences, notification settings, device tokens, and account information where required to provide the service.</p>
            </section>
            <section>
              <h2 className="mb-2 text-base font-semibold text-foreground">Location</h2>
              <p>Location is only used for venue discovery and nearby experiences if you allow it. You can decline or revoke location access at any time in your device settings.</p>
            </section>
            <section>
              <h2 className="mb-2 text-base font-semibold text-foreground">Notifications</h2>
              <p>Push notifications are optional. You can enable or disable them in app settings or browser/device settings.</p>
            </section>
            <section>
              <h2 className="mb-2 text-base font-semibold text-foreground">Analytics</h2>
              <p>We may collect app usage and performance data to improve reliability, usability, and feature quality.</p>
            </section>
            <section>
              <h2 className="mb-2 text-base font-semibold text-foreground">Contact</h2>
              <p>If you need support with privacy or data handling, contact the Sports Fixtures team through the main website support channels.</p>
            </section>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
