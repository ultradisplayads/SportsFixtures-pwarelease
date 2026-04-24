import { GamificationStats } from "@/components/gamification-stats"
import { Leaderboard } from "@/components/leaderboard"
import { HeaderMenu } from "@/components/header-menu"
import { BottomNav } from "@/components/bottom-nav"
import { LiveTicker } from "@/components/live-ticker"

export default function SocialPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LiveTicker />
      <HeaderMenu />

      <div className="flex-1 overflow-auto pb-20">
        <div className="mx-auto max-w-2xl space-y-4 p-4">
          <div>
            <h1 className="mb-2 text-2xl font-bold">Your Stats</h1>
            <p className="text-sm text-muted-foreground">Make predictions, earn points, and climb the leaderboard!</p>
          </div>

          <GamificationStats />
          <Leaderboard />
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
