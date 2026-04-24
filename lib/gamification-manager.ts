"use client"

// Gamification System for Sports Fixtures
// Tracks user interactions, predictions, and awards points

export interface UserPrediction {
  matchId: string
  homeScore: number
  awayScore: number
  timestamp: number
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

const POINTS_SYSTEM = {
  view_match: 1,
  predict_match: 5,
  correct_prediction: 20,
  close_prediction: 10,
  share_match: 3,
  daily_streak: 5,
  weekly_streak: 25,
  follow_team: 2,
}

const LEVELS = [
  { level: 1, minPoints: 0, name: "Rookie Fan", badge: "🆕" },
  { level: 2, minPoints: 100, name: "Casual Supporter", badge: "⚽" },
  { level: 3, minPoints: 500, name: "Die-Hard Fan", badge: "🔥" },
  { level: 4, minPoints: 1000, name: "Super Fan", badge: "⭐" },
  { level: 5, minPoints: 2500, name: "Legend", badge: "👑" },
  { level: 6, minPoints: 5000, name: "Hall of Famer", badge: "🏆" },
]

class GamificationManager {
  private storageKey = "sportsfixtures_gamification"
  private predictionsKey = "sportsfixtures_predictions"
  private interactionsKey = "sportsfixtures_interactions"

  getUserStats(): UserStats {
    if (typeof window === "undefined") {
      return this.getDefaultStats()
    }

    const stored = localStorage.getItem(this.storageKey)
    if (!stored) {
      return this.getDefaultStats()
    }

    try {
      return JSON.parse(stored)
    } catch {
      return this.getDefaultStats()
    }
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
      lastPredictionDate: new Date().toDateString(),
      adsWatchedToday: 0,
    }
  }

  saveUserStats(stats: UserStats) {
    if (typeof window === "undefined") return
    localStorage.setItem(this.storageKey, JSON.stringify(stats))
  }

  addPoints(points: number, reason: string) {
    const stats = this.getUserStats()
    stats.totalPoints += points

    // Update level
    const newLevel = this.calculateLevel(stats.totalPoints)
    if (newLevel.level > stats.level) {
      stats.level = newLevel.level
      stats.rank = newLevel.name
      // Award badge for leveling up
      if (!stats.badges.includes(newLevel.badge)) {
        stats.badges.push(newLevel.badge)
      }
    }

    // Track interaction
    this.trackInteraction({
      type: "view",
      timestamp: Date.now(),
      points,
    })

    this.saveUserStats(stats)
    return stats
  }

  calculateLevel(points: number) {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (points >= LEVELS[i].minPoints) {
        return LEVELS[i]
      }
    }
    return LEVELS[0]
  }

  canMakePrediction(tier: string): { allowed: boolean; reason?: string } {
    const stats = this.getUserStats()
    const today = new Date().toDateString()

    // Reset daily counts if new day
    if (stats.lastPredictionDate !== today) {
      stats.dailyPredictionsUsed = 0
      stats.adsWatchedToday = 0
      stats.lastPredictionDate = today
      this.saveUserStats(stats)
    }

    // Gold = unlimited predictions
    if (tier === "gold") {
      return { allowed: true }
    }

    // Silver = higher daily limit
    if (tier === "silver") {
      if (stats.dailyPredictionsUsed >= 20) {
        return {
          allowed: false,
          reason: "Daily limit reached. Upgrade to Gold for unlimited predictions.",
        }
      }
      return { allowed: true }
    }

    // Bronze = basic limit
    if (stats.dailyPredictionsUsed >= 10) {
      return {
        allowed: false,
        reason: "Daily limit reached. Upgrade to Silver or Gold for more predictions.",
      }
    }
    return { allowed: true }

    return { allowed: true }
  }

  watchedAd() {
    const stats = this.getUserStats()
    stats.adsWatchedToday++
    this.saveUserStats(stats)
  }

  savePrediction(matchId: string, homeScore: number, awayScore: number) {
    if (typeof window === "undefined") return

    const predictions = this.getPredictions()
    const prediction: UserPrediction = {
      matchId,
      homeScore,
      awayScore,
      timestamp: Date.now(),
    }

    predictions[matchId] = prediction
    localStorage.setItem(this.predictionsKey, JSON.stringify(predictions))

    const stats = this.getUserStats()
    stats.dailyPredictionsUsed++
    stats.predictionsCount++

    // Award points for making a prediction
    this.addPoints(POINTS_SYSTEM.predict_match, "Made prediction")

    this.saveUserStats(stats)
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
    const predictions = this.getPredictions()
    return predictions[matchId] || null
  }

  evaluatePrediction(matchId: string, actualHomeScore: number, actualAwayScore: number) {
    const prediction = this.getPrediction(matchId)
    if (!prediction) return

    const stats = this.getUserStats()

    if (prediction.homeScore === actualHomeScore && prediction.awayScore === actualAwayScore) {
      // Exact prediction
      prediction.result = "correct"
      prediction.pointsEarned = POINTS_SYSTEM.correct_prediction
      stats.correctPredictions++
      stats.streak++
      this.addPoints(POINTS_SYSTEM.correct_prediction, "Correct prediction")
    } else {
      const homeCorrect =
        Math.sign(prediction.homeScore - prediction.awayScore) === Math.sign(actualHomeScore - actualAwayScore)
      if (homeCorrect) {
        // Got the winner right
        prediction.result = "close"
        prediction.pointsEarned = POINTS_SYSTEM.close_prediction
        this.addPoints(POINTS_SYSTEM.close_prediction, "Close prediction")
      } else {
        prediction.result = "wrong"
        prediction.pointsEarned = 0
        stats.streak = 0
      }
    }

    // Update accuracy
    stats.accuracy = (stats.correctPredictions / stats.predictionsCount) * 100

    // Save updated prediction
    const predictions = this.getPredictions()
    predictions[matchId] = prediction
    localStorage.setItem(this.predictionsKey, JSON.stringify(predictions))

    this.saveUserStats(stats)
  }

  trackInteraction(interaction: UserInteraction) {
    if (typeof window === "undefined") return

    const interactions = this.getInteractions()
    interactions.push(interaction)

    // Keep only last 100 interactions
    if (interactions.length > 100) {
      interactions.shift()
    }

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

  getLeaderboard(scope: "global" | "team" | "league" = "global", id?: string): LeaderboardEntry[] {
    // In a real app, this would fetch from a backend API
    // For now, return mock data
    return [
      { userId: "1", username: "You", points: this.getUserStats().totalPoints, rank: 1, badge: "🏆" },
      { userId: "2", username: "FootballFanatic", points: 5240, rank: 2, badge: "👑" },
      { userId: "3", username: "ScorePredictorPro", points: 4890, rank: 3, badge: "⭐" },
      { userId: "4", username: "SportsBuff2024", points: 4120, rank: 4, badge: "🔥" },
      { userId: "5", username: "GoalGuesser", points: 3850, rank: 5, badge: "⚽" },
    ]
  }

  checkDailyStreak() {
    const stats = this.getUserStats()
    const interactions = this.getInteractions()

    if (interactions.length === 0) return

    const today = new Date().setHours(0, 0, 0, 0)
    const hasInteractionToday = interactions.some((i) => {
      const interactionDate = new Date(i.timestamp).setHours(0, 0, 0, 0)
      return interactionDate === today
    })

    if (hasInteractionToday && stats.streak > 0) {
      // Continue streak
      this.addPoints(POINTS_SYSTEM.daily_streak, "Daily streak")
    }
  }
}

export const gamificationManager = new GamificationManager()
