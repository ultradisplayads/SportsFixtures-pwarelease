"use client"

import { TrendingUp, ExternalLink, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { ExternalLinkGuard } from "@/components/platform/external-link-guard"

interface MatchOddsProps {
  homeTeam: string
  awayTeam: string
  matchId: string
}

interface OddsData {
  provider: string
  homeWin: string
  draw: string
  awayWin: string
  url: string
}

export function MatchOdds({ homeTeam, awayTeam, matchId }: MatchOddsProps) {
  const [odds, setOdds] = useState<OddsData[]>([])

  useEffect(() => {
    // Mock odds data - In production, integrate with odds API
    setOdds([
      {
        provider: "Bet365",
        homeWin: "2.10",
        draw: "3.40",
        awayWin: "3.25",
        url: "https://www.bet365.com",
      },
      {
        provider: "William Hill",
        homeWin: "2.15",
        draw: "3.30",
        awayWin: "3.20",
        url: "https://www.williamhill.com",
      },
      {
        provider: "Betfair",
        homeWin: "2.12",
        draw: "3.35",
        awayWin: "3.30",
        url: "https://www.betfair.com",
      },
    ])
  }, [matchId])

  const handleOddsClick = (provider: string) => {
    triggerHaptic("medium")
    console.log(`[v0] Odds provider clicked: ${provider}`)
  }

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 p-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
          <div className="text-xs text-orange-700 dark:text-orange-300">
            Betting involves risk. Please gamble responsibly. Age 18+ only.
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-bold">Betting Odds</h3>
        </div>

        <div className="mb-3 grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-2 text-center text-xs font-semibold">
          <div>{homeTeam}</div>
          <div>Draw</div>
          <div>{awayTeam}</div>
        </div>

        <div className="space-y-2">
          {odds.map((odd) => (
            <ExternalLinkGuard
              key={odd.provider}
              href={odd.url}
              onClick={() => handleOddsClick(odd.provider)}
              className="block rounded-lg border border-border bg-background hover:bg-accent"
            >
              <div className="flex items-center justify-between border-b border-border p-2">
                <span className="text-sm font-semibold">{odd.provider}</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-3 gap-2 p-2 text-center">
                <div className="rounded bg-blue-500/10 py-2">
                  <div className="text-lg font-bold text-blue-500">{odd.homeWin}</div>
                </div>
                <div className="rounded bg-muted/50 py-2">
                  <div className="text-lg font-bold">{odd.draw}</div>
                </div>
                <div className="rounded bg-red-500/10 py-2">
                  <div className="text-lg font-bold text-red-500">{odd.awayWin}</div>
                </div>
              </div>
            </ExternalLinkGuard>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-bold">More Markets</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between rounded-lg bg-muted/30 p-2">
            <span className="text-muted-foreground">Over 2.5 Goals</span>
            <span className="font-semibold">1.85</span>
          </div>
          <div className="flex justify-between rounded-lg bg-muted/30 p-2">
            <span className="text-muted-foreground">Both Teams to Score</span>
            <span className="font-semibold">1.72</span>
          </div>
          <div className="flex justify-between rounded-lg bg-muted/30 p-2">
            <span className="text-muted-foreground">First Goal</span>
            <span className="font-semibold">Various</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-primary/10 p-3 text-center text-xs text-primary">
        Sports Fixtures may earn commission from betting partners
      </div>
    </div>
  )
}
