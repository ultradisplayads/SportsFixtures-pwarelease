import { LiveTicker } from "@/components/live-ticker"
import { SearchBar } from "@/components/search-bar"
import { BottomNav } from "@/components/bottom-nav"
import { HeaderMenu } from "@/components/header-menu"
import { FavouritesList } from "@/components/favourites-list"

export default function FavouritesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      {/* Live Ticker */}
      <LiveTicker />

      {/* Header with Menu */}
      <HeaderMenu />

      {/* Search Bar */}
      <SearchBar />

      {/* Favourites List */}
      <FavouritesList />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
