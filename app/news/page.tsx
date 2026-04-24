import { HeaderMenu } from "@/components/header-menu"
import { BottomNav } from "@/components/bottom-nav"
import { NewsFeed } from "@/components/news-feed"
import { LiveTicker } from "@/components/live-ticker"
import { BreakingNewsBanner } from "@/components/breaking-news-banner"
import Link from "next/link"
import { Tv } from "lucide-react"

export default function NewsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LiveTicker />
      <HeaderMenu />
      <BreakingNewsBanner />

      <div className="flex-1 overflow-auto pb-20">
        <div className="border-b border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Sports News</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">Breaking news, transfers, previews</p>
            </div>
            <Link
              href="/tv"
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              <Tv className="h-4 w-4 text-primary" />
              TV Guide
            </Link>
          </div>
        </div>

        <NewsFeed />
      </div>

      <BottomNav />
    </div>
  )
}
