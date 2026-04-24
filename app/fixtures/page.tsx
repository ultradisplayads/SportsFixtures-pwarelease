import { LiveTicker } from "@/components/live-ticker"
import { SearchBar } from "@/components/search-bar"
import { SportsSelector } from "@/components/sports-selector"
import { CountriesSelector } from "@/components/countries-selector"
import { LeaguesSelector } from "@/components/leagues-selector"
import { FixturesList } from "@/components/fixtures-list"
import { BottomNav } from "@/components/bottom-nav"
import { FilterButton } from "@/components/filter-button"
import { HeaderMenu } from "@/components/header-menu"

export default function FixturesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      {/* Live Ticker */}
      <LiveTicker />

      {/* Header with Menu */}
      <HeaderMenu />

      {/* Search Bar */}
      <SearchBar />

      {/* Selector Block - Sports, Countries, Leagues */}
      <div className="border-b border-border bg-card">
        <SportsSelector />
        <CountriesSelector />
        <LeaguesSelector />
      </div>

      {/* Fixtures List */}
      <FixturesList />

      {/* Filter & Sort Button */}
      <FilterButton />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
