import { LiveTicker } from "@/components/live-ticker"
import { SearchBar } from "@/components/search-bar"
import { SportsSelector } from "@/components/sports-selector"
import { CountriesSelector } from "@/components/countries-selector"
import { LeaguesSelector } from "@/components/leagues-selector"
import { BottomNav } from "@/components/bottom-nav"
import { FilterButton } from "@/components/filter-button"
import { HeaderMenu } from "@/components/header-menu"
import { LiveMatchesList } from "@/components/live-matches-list"

export default function LivePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <LiveTicker />
      <HeaderMenu />
      <SearchBar />
      <div className="border-b border-border bg-card">
        <SportsSelector />
        <CountriesSelector />
        <LeaguesSelector />
      </div>
      <LiveMatchesList />
      <FilterButton />
      <BottomNav />
    </div>
  )
}
