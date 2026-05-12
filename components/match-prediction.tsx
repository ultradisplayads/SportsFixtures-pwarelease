"use client"

import { useEffect, useState } from "react"
import { Trophy } from "lucide-react"
import { CelebrationFX } from "@/components/celebration-fx"
import { SmartImage } from "@/components/assets/smart-image"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { gamificationManager, WEEKLY_PREDICTION_LIMIT } from "@/lib/gamification-manager"

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
  const [celebrate, setCelebrate] = useState(false)
  const [message, setMessage] = useState("")
  const [remaining, setRemaining] = useState(WEEKLY_PREDICTION_LIMIT)

  useEffect(() => {
    const existing = gamificationManager.getPrediction(matchId)
    if (existing) {
      setHomeScore(existing.homeScore)
      setAwayScore(existing.awayScore)
      setHasPredicted(true)
    }
    setRemaining(gamificationManager.canMakePrediction().remaining)
  }, [matchId])

  const handlePredict = () => {
    triggerHaptic("success")
    const result = gamificationManager.savePrediction(matchId, homeScore, awayScore)
    if (!result.ok) {
      setMessage(result.reason || "Prediction unavailable")
      return
    }
    setHasPredicted(true)
    setShowSuccess(true)
    setCelebrate(true)
    setMessage("")
    setRemaining(gamificationManager.canMakePrediction().remaining)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const Stepper = ({
    value,
    setValue,
    disabled,
  }: {
    value: number
    setValue: (value: number) => void
    disabled: boolean
  }) => (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => {
          triggerHaptic("light")
          setValue(Math.max(0, value - 1))
        }}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted hover:bg-accent disabled:opacity-40"
        disabled={disabled}
        type="button"
      >
        -
      </button>
      <span className="w-8 text-center text-xl font-bold">{value}</span>
      <button
        onClick={() => {
          triggerHaptic("light")
          setValue(Math.min(9, value + 1))
        }}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted hover:bg-accent disabled:opacity-40"
        disabled={disabled}
        type="button"
      >
        +
      </button>
    </div>
  )

  return (
    <>
      <CelebrationFX trigger={celebrate} type="confetti" />
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <h3 className="font-bold">Make Your Prediction</h3>
          <span className="ml-auto text-xs text-muted-foreground">{remaining}/{WEEKLY_PREDICTION_LIMIT} left</span>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Just for fun. No gambling, no cash prizes. Picks lock per event.
        </p>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 text-center">
            <SmartImage kind="team_badge" src={homeLogo} fallbackLabel={homeTeam} alt={homeTeam} className="mx-auto mb-2 h-12 w-12 object-contain" width={48} height={48} />
            <p className="mb-2 text-sm font-medium">{homeTeam}</p>
            <Stepper value={homeScore} setValue={setHomeScore} disabled={hasPredicted} />
          </div>

          <div className="text-2xl font-bold text-muted-foreground">vs</div>

          <div className="flex-1 text-center">
            <SmartImage kind="team_badge" src={awayLogo} fallbackLabel={awayTeam} alt={awayTeam} className="mx-auto mb-2 h-12 w-12 object-contain" width={48} height={48} />
            <p className="mb-2 text-sm font-medium">{awayTeam}</p>
            <Stepper value={awayScore} setValue={setAwayScore} disabled={hasPredicted} />
          </div>
        </div>

        {!hasPredicted && (
          <button onClick={handlePredict} className="mt-4 w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90" type="button">
            Submit Prediction (+2 points)
          </button>
        )}

        {hasPredicted && (
          <div className="mt-4 rounded-lg bg-primary/10 p-3 text-center text-sm font-medium text-primary">
            Prediction saved: {homeScore}-{awayScore}
          </div>
        )}

        {showSuccess && (
          <div className="mt-3 rounded-lg bg-green-500/10 p-3 text-center text-sm font-medium text-green-600 dark:text-green-400">
            Prediction saved. Good luck.
          </div>
        )}

        {message && (
          <div className="mt-3 rounded-lg bg-destructive/10 p-3 text-center text-sm font-medium text-destructive">
            {message}
          </div>
        )}
      </div>
    </>
  )
}
