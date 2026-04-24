"use client"

import { useState, useEffect } from "react"
import { gamificationManager } from "@/lib/gamification-manager"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { CelebrationFX } from "@/components/celebration-fx"
import { Trophy } from "lucide-react"
import { SmartImage } from "@/components/assets/smart-image"

interface MatchPredictionProps {
  matchId: string
  homeTeam: string
  awayTeam: string
  homeLogo?: string | null
  awayLogo?: string | null
}

export function MatchPrediction({ matchId, homeTeam, awayTeam, homeLogo, awayLogo }: MatchPredictionProps) {
  const [homeScore, setHomeScore] = useState(0)
  const [awayScore, setAwayScore] = useState(0)
  const [hasPredicted, setHasPredicted] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    const existing = gamificationManager.getPrediction(matchId)
    if (existing) {
      setHomeScore(existing.homeScore)
      setAwayScore(existing.awayScore)
      setHasPredicted(true)
    }
  }, [matchId])

  const [celebrate, setCelebrate] = useState(false)

  const handlePredict = () => {
    triggerHaptic("success")
    gamificationManager.savePrediction(matchId, homeScore, awayScore)
    setHasPredicted(true)
    setShowSuccess(true)
    setCelebrate(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  return (
    <>
    <CelebrationFX trigger={celebrate} type="confetti" />
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        <h3 className="font-bold">Make Your Prediction</h3>
        {hasPredicted && <span className="ml-auto text-xs text-green-500">✓ Predicted</span>}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 text-center">
          <SmartImage kind="team_badge" src={homeLogo} fallbackLabel={homeTeam} alt={homeTeam} className="mx-auto mb-2 h-12 w-12 object-contain" width={48} height={48} />
          <p className="mb-2 text-sm font-medium">{homeTeam}</p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => {
                triggerHaptic("light")
                setHomeScore(Math.max(0, homeScore - 1))
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted hover:bg-accent"
              disabled={hasPredicted}
            >
              −
            </button>
            <span className="w-8 text-center text-xl font-bold">{homeScore}</span>
            <button
              onClick={() => {
                triggerHaptic("light")
                setHomeScore(Math.min(9, homeScore + 1))
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted hover:bg-accent"
              disabled={hasPredicted}
            >
              +
            </button>
          </div>
        </div>

        <div className="text-2xl font-bold text-muted-foreground">vs</div>

        <div className="flex-1 text-center">
          <SmartImage kind="team_badge" src={awayLogo} fallbackLabel={awayTeam} alt={awayTeam} className="mx-auto mb-2 h-12 w-12 object-contain" width={48} height={48} />
          <p className="mb-2 text-sm font-medium">{awayTeam}</p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => {
                triggerHaptic("light")
                setAwayScore(Math.max(0, awayScore - 1))
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted hover:bg-accent"
              disabled={hasPredicted}
            >
              −
            </button>
            <span className="w-8 text-center text-xl font-bold">{awayScore}</span>
            <button
              onClick={() => {
                triggerHaptic("light")
                setAwayScore(Math.min(9, awayScore + 1))
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted hover:bg-accent"
              disabled={hasPredicted}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {!hasPredicted && (
        <button
          onClick={handlePredict}
          className="mt-4 w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Submit Prediction (+5 points)
        </button>
      )}

      {showSuccess && (
        <div className="mt-3 rounded-lg bg-green-500/10 p-3 text-center text-sm font-medium text-green-500">
          Prediction saved! Good luck!
        </div>
      )}
    </div>
    </>
  )
}
