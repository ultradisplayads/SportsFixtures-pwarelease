import { LiveTicker } from "@/components/live-ticker"
import { SearchBar } from "@/components/search-bar"
import { BottomNav } from "@/components/bottom-nav"
import { FilterButton } from "@/components/filter-button"
import { HeaderMenu } from "@/components/header-menu"
import { NotificationPermissionBanner } from "@/components/notification-permission-banner"
import { LocationBanner } from "@/components/location-banner"
import { OnboardingCheck } from "@/components/onboarding-check"
import { TimezoneSelector } from "@/components/timezone-selector"
import { NearbyEventFilter } from "@/components/nearby-event-filter"
import { FixturesFilterProvider } from "@/lib/fixtures-filter-context"
import { HomeModuleRenderer } from "@/components/home-module-renderer"

export default function HomePage() {
  return (
    <FixturesFilterProvider>
      <div className="flex min-h-screen flex-col bg-background pb-20">
        <OnboardingCheck />
        {/* LiveTicker now covers both live scores (primary rail) and breaking news / TV (secondary rail) */}
        <LiveTicker />
        <HeaderMenu />
        <LocationBanner />
        <SearchBar />

        {/* Timezone + Nearby quick-access bar */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-border bg-background px-3 py-2 scrollbar-hide">
          <TimezoneSelector />
          <NearbyEventFilter />
        </div>

        {/* Modules rendered in user's saved order */}
        <HomeModuleRenderer />

        <FilterButton />
        <BottomNav />
        <NotificationPermissionBanner />
      </div>
    </FixturesFilterProvider>
  )
}
