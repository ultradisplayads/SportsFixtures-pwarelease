"use client"

export interface UserPrediction {
  matchId: string
  homeScore: number
  awayScore: number
  timestamp: number
  weekKey: string
  result?: "correct" | "close" | "wrong"
  pointsEarned?: number
}

export interface UserInteraction {
  type: "view" | "predict" | "share" | "comment"
  matchId?: string
  teamId?: string
  leagueId?: string
  timestamp: number
  points: number
}

export interface UserStats {
  totalPoints: number
  level: number
  rank: string
  predictionsCount: number
  correctPredictions: number
  accuracy: number
  streak: number
  badges: string[]
  favoriteTeam?: string
  favoriteLeague?: string
  dailyPredictionsUsed: number
  weeklyPredictionsUsed: number
  predictionWeekKey: string
  lastPredictionDate: string
  adsWatchedToday: number
}

export interface LeaderboardEntry {
  userId: string
  username: string
  points: number
  rank: number
  avatar?: string
  badge?: string
}

export const WEEKLY_PREDICTION_LIMIT = 20

export const PREDICTION_POINTS = {
  submit: 2,
  exactScore: 25,
  correctOutcome: 10,
  correctGoalDifference: 7,
  oneTeamScore: 3,
  shareMatch: 3,
  followTeam: 2,
}

const LEVELS = [
  { level: 1, minPoints: 0, name: "Rookie Fan", badge: "R" },
  { level: 2, minPoints: 100, name: "Casual Supporter", badge: "F" },
  { level: 3, minPoints: 500, name: "Die-Hard Fan", badge: "S" },
  { level: 4, minPoints: 1000, name: "Super Fan", badge: "A" },
  { level: 5, minPoints: 2500, name: "Legend", badge: "L" },
  { level: 6, minPoints: 5000, name: "Hall of Famer", badge: "H" },
]

class GamificationManager {
  private storageKey = "sportsfixtures_gamification"
  private predictionsKey = "sportsfixtures_predictions"
  private interactionsKey = "sportsfixtures_interactions"

  getWeekKey(date = new Date()) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`
  }

  private getDefaultStats(): UserStats {
    return {
      totalPoints: 0,
      level: 1,
      rank: "Rookie Fan",
      predictionsCount: 0,
      correctPredictions: 0,
      accuracy: 0,
      streak: 0,
      badges: [],
      dailyPredictionsUsed: 0,
      weeklyPredictionsUsed: 0,
      predictionWeekKey: this.getWeekKey(),
      lastPredictionDate: new Date().toDateString(),
      adsWatchedToday: 0,
    }
  }

  private normaliseStats(stats: UserStats): UserStats {
    const weekKey = this.getWeekKey()
    const today = new Date().toDateString()
    const predictions = this.getPredictions()

    if (!stats.predictionWeekKey) stats.predictionWeekKey = weekKey
    if (stats.predictionWeekKey !== weekKey) {
      stats.weeklyPredictionsUsed = 0
      stats.predictionWeekKey = weekKey
    }
    if (typeof stats.weeklyPredictionsUsed !== "number") {
      stats.weeklyPredictionsUsed = Object.values(predictions).filter((p) => p.weekKey === weekKey).length
    }
    if (stats.lastPredictionDate !== today) {
      stats.dailyPredictionsUsed = 0
      stats.adsWatchedToday = 0
      stats.lastPredictionDate = today
    }
    return stats
  }

  getUserStats(): UserStats {
    if (typeof window === "undefined") return this.getDefaultStats()
    const stored = localStorage.getItem(this.storageKey)
    if (!stored) return this.getDefaultStats()
    try {
      return this.normaliseStats(JSON.parse(stored))
    } catch {
      return this.getDefaultStats()
    }
  }

  saveUserStats(stats: UserStats) {
    if (typeof window === "undefined") return
    localStorage.setItem(this.storageKey, JSON.stringify(stats))
    window.dispatchEvent(new CustomEvent("sf:gamification:update", { detail: stats }))
  }

  calculateLevel(points: number) {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (points >= LEVELS[i].minPoints) return LEVELS[i]
    }
    return LEVELS[0]
  }

  private applyLevel(stats: UserStats) {
    const next = this.calculateLevel(stats.totalPoints)
    stats.level = next.level
    stats.rank = next.name
    if (!stats.badges.includes(next.badge)) stats.badges.push(next.badge)
  }

  addPoints(points: number, reason: string, matchId?: string) {
    const stats = this.getUserStats()
    stats.totalPoints += points
    this.applyLevel(stats)
    this.trackInteraction({ type: "view", matchId, timestamp: Date.now(), points })
    this.saveUserStats(stats)
    return stats
  }

  canMakePrediction(_tier = "bronze"): { allowed: boolean; reason?: string; remaining: number } {
    const stats = this.getUserStats()
    const remaining = Math.max(0, WEEKLY_PREDICTION_LIMIT - stats.weeklyPredictionsUsed)
    if (remaining <= 0) {
      return {
        allowed: false,
        remaining: 0,
        reason: `Weekly fun-pick limit reached. You can make ${WEEKLY_PREDICTION_LIMIT} predictions per week.`,
      }
    }
    return { allowed: true, remaining }
  }

  watchedAd() {
    const stats = this.getUserStats()
    stats.adsWatchedToday++
    this.saveUserStats(stats)
  }

  savePrediction(matchId: string, homeScore: number, awayScore: number): { ok: boolean; reason?: string } {
    if (typeof window === "undefined") return { ok: false, reason: "Predictions unavailable" }
    const existing = this.getPrediction(matchId)
    const allowance = this.canMakePrediction()
    if (!existing && !allowance.allowed) return { ok: false, reason: allowance.reason }

    const predictions = this.getPredictions()
    predictions[matchId] = {
      matchId,
      homeScore,
      awayScore,
      timestamp: Date.now(),
      weekKey: this.getWeekKey(),
    }
    localStorage.setItem(this.predictionsKey, JSON.stringify(predictions))

    const stats = this.getUserStats()
    if (!existing) {
      stats.predictionsCount++
      stats.dailyPredictionsUsed++
      stats.weeklyPredictionsUsed++
      stats.totalPoints += PREDICTION_POINTS.submit
      this.trackInteraction({ type: "predict", matchId, timestamp: Date.now(), points: PREDICTION_POINTS.submit })
    }
    this.applyLevel(stats)
    this.saveUserStats(stats)
    return { ok: true }
  }

  getPredictions(): Record<string, UserPrediction> {
    if (typeof window === "undefined") return {}
    const stored = localStorage.getItem(this.predictionsKey)
    if (!stored) return {}
    try {
      return JSON.parse(stored)
    } catch {
      return {}
    }
  }

  getPrediction(matchId: string): UserPrediction | null {
    return this.getPredictions()[matchId] || null
  }

  evaluatePrediction(matchId: string, actualHomeScore: number, actualAwayScore: number) {
    const prediction = this.getPrediction(matchId)
    if (!prediction || prediction.result) return

    const stats = this.getUserStats()
    const exact = prediction.homeScore === actualHomeScore && prediction.awayScore === actualAwayScore
    const predictedDiff = prediction.homeScore - prediction.awayScore
    const actualDiff = actualHomeScore - actualAwayScore
    const outcomeCorrect = Math.sign(predictedDiff) === Math.sign(actualDiff)
    const goalDiffCorrect = predictedDiff === actualDiff
    const teamScoresCorrect =
      (prediction.homeScore === actualHomeScore ? 1 : 0) +
      (prediction.awayScore === actualAwayScore ? 1 : 0)

    const earned = exact
      ? PREDICTION_POINTS.exactScore
      : (outcomeCorrect ? PREDICTION_POINTS.correctOutcome : 0) +
        (goalDiffCorrect ? PREDICTION_POINTS.correctGoalDifference : 0) +
        teamScoresCorrect * PREDICTION_POINTS.oneTeamScore

    prediction.result = exact ? "correct" : earned > 0 ? "close" : "wrong"
    prediction.pointsEarned = earned
    if (exact) stats.correctPredictions++
    stats.streak = earned > 0 ? stats.streak + 1 : 0
    stats.totalPoints += earned
    stats.accuracy = stats.predictionsCount > 0 ? (stats.correctPredictions / stats.predictionsCount) * 100 : 0
    this.applyLevel(stats)

    const predictions = this.getPredictions()
    predictions[matchId] = prediction
    localStorage.setItem(this.predictionsKey, JSON.stringify(predictions))
    this.saveUserStats(stats)
  }

  trackInteraction(interaction: UserInteraction) {
    if (typeof window === "undefined") return
    const interactions = this.getInteractions()
    interactions.push(interaction)
    if (interactions.length > 100) interactions.shift()
    localStorage.setItem(this.interactionsKey, JSON.stringify(interactions))
  }

  getInteractions(): UserInteraction[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(this.interactionsKey)
    if (!stored) return []
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }

  getLeaderboard(): LeaderboardEntry[] {
    return [
      { userId: "1", username: "You", points: this.getUserStats().totalPoints, rank: 1, badge: "T" },
    ]
  }
}

export const gamificationManager = new GamificationManager()
