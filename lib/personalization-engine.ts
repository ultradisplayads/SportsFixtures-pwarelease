// Personalization Engine with ML-based recommendations

export interface UserActivity {
  matchId: string
  teamId?: string
  leagueId?: string
  sport?: string
  action: "view" | "favorite" | "share" | "notification_open"
  timestamp: Date
  duration?: number
}

export interface UserPreferences {
  favoriteTeams: string[]
  favoriteLeagues: string[]
  favoriteSports: string[]
  location?: { latitude: number; longitude: number; country?: string }
  language?: string
}

export interface Recommendation {
  id: string
  type: "match" | "team" | "league"
  title: string
  description: string
  confidence: number
  reason: string
  data: any
}

// ─── Pinned entities always surfaced in recommendations ──────────────────────
// Celtic FC: idTeam=133719, SPFL (Scottish Premiership): id=4330
const PINNED_TEAMS: { id: string; name: string; league: string; leagueId: string }[] = [
  { id: "133719", name: "Celtic FC", league: "Scottish Premiership", leagueId: "4330" },
]
const PINNED_LEAGUE_IDS = ["4330"] // Scottish Premiership always loaded
// ─────────────────────────────────────────────────────────────────────────────

class PersonalizationEngine {
  private activities: UserActivity[] = []
  private preferences: UserPreferences = {
    favoriteTeams: ["133719"], // Celtic FC always in favourites by default
    favoriteLeagues: ["4328", "4330", "4329"], // EPL, Scottish Prem, SPFL
    favoriteSports: [],
  }

  constructor() {
    this.loadData()
  }

  private loadData() {
    if (typeof window === "undefined") return

    try {
      const savedActivities = localStorage.getItem("userActivities")
      if (savedActivities) {
        this.activities = JSON.parse(savedActivities).map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp),
        }))
      }

      const savedPrefs = localStorage.getItem("userPreferences")
      if (savedPrefs) {
        this.preferences = JSON.parse(savedPrefs)
      }
    } catch (error) {
      console.error("[v0] Failed to load personalization data:", error)
    }
  }

  private saveData() {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem("userActivities", JSON.stringify(this.activities))
      localStorage.setItem("userPreferences", JSON.stringify(this.preferences))
    } catch (error) {
      console.error("[v0] Failed to save personalization data:", error)
    }
  }

  // Track user activity
  trackActivity(activity: Omit<UserActivity, "timestamp">) {
    this.activities.push({
      ...activity,
      timestamp: new Date(),
    })

    // Keep only last 500 activities
    if (this.activities.length > 500) {
      this.activities = this.activities.slice(-500)
    }

    this.saveData()
    console.log("[v0] Activity tracked:", activity.action)
  }

  // Update user preferences
  updatePreferences(prefs: Partial<UserPreferences>) {
    this.preferences = { ...this.preferences, ...prefs }
    this.saveData()
  }

  // Get personalized recommendations
  getRecommendations(limit = 10): Recommendation[] {
    const recommendations: Recommendation[] = []

    // ── Always pin Celtic FC as the first recommendation ──────────────────
    PINNED_TEAMS.forEach((team) => {
      recommendations.push({
        id: `pinned_team_${team.id}`,
        type: "team",
        title: team.name,
        description: team.league,
        confidence: 1.0, // Maximum confidence — always surfaced
        reason: "Featured team",
        data: { teamId: team.id, leagueId: team.leagueId },
      })
    })
    // ─────────────────────────────────────────────────────────────────────

    // Analyze viewing history
    const teamFrequency = this.getTeamFrequency()
    const leagueFrequency = this.getLeagueFrequency()

    // Recommend popular teams user follows (excluding already-pinned)
    const pinnedTeamIds = new Set(PINNED_TEAMS.map((t) => t.id))
    Object.entries(teamFrequency)
      .filter(([teamId]) => !pinnedTeamIds.has(teamId))
      .slice(0, 3)
      .forEach(([teamId, count]) => {
        recommendations.push({
          id: `team_${teamId}`,
          type: "team",
          title: `Team ${teamId}`,
          description: "Based on your viewing history",
          confidence: Math.min(count / 10, 0.95), // Cap below 1.0 so pinned always wins
          reason: `Viewed ${count} times`,
          data: { teamId },
        })
      })

    // Recommend leagues from viewing history
    Object.entries(leagueFrequency)
      .slice(0, 2)
      .forEach(([leagueId, count]) => {
        recommendations.push({
          id: `league_${leagueId}`,
          type: "league",
          title: `League ${leagueId}`,
          description: "You might like this league",
          confidence: Math.min(count / 15, 0.9),
          reason: `Viewed ${count} matches`,
          data: { leagueId },
        })
      })

    // Recommend based on location
    if (this.preferences.location) {
      recommendations.push({
        id: "local_matches",
        type: "match",
        title: "Matches Near You",
        description: `Based on your location`,
        confidence: 0.8,
        reason: "Local matches",
        data: { location: this.preferences.location },
      })
    }

    // Trending in region
    recommendations.push({
      id: "trending_region",
      type: "match",
      title: "Trending in Your Region",
      description: "Popular matches nearby",
      confidence: 0.65,
      reason: "Regional popularity",
      data: {},
    })

    // Sort by confidence descending — pinned entities (confidence=1.0) always top 5
    return recommendations.sort((a, b) => b.confidence - a.confidence).slice(0, limit)
  }

  // Get team viewing frequency
  private getTeamFrequency(): Record<string, number> {
    const frequency: Record<string, number> = {}

    this.activities.forEach((activity) => {
      if (activity.teamId) {
        frequency[activity.teamId] = (frequency[activity.teamId] || 0) + 1
      }
    })

    return frequency
  }

  // Get league viewing frequency
  private getLeagueFrequency(): Record<string, number> {
    const frequency: Record<string, number> = {}

    this.activities.forEach((activity) => {
      if (activity.leagueId) {
        frequency[activity.leagueId] = (frequency[activity.leagueId] || 0) + 1
      }
    })

    return frequency
  }

  // Get sport viewing frequency
  private getSportFrequency(): Record<string, number> {
    const frequency: Record<string, number> = {}

    this.activities.forEach((activity) => {
      if (activity.sport) {
        frequency[activity.sport] = (frequency[activity.sport] || 0) + 1
      }
    })

    return frequency
  }

  // Get suggested matches based on user preferences
  getSuggestedMatches(): string[] {
    // Always include pinned team IDs first
    const pinnedIds = PINNED_TEAMS.map((t) => t.id)
    const teamIds = [...pinnedIds, ...this.preferences.favoriteTeams, ...Object.keys(this.getTeamFrequency()).slice(0, 5)]
    return [...new Set(teamIds)]
  }

  // Get pinned league IDs (always loaded in fixtures)
  getPinnedLeagueIds(): string[] {
    return PINNED_LEAGUE_IDS
  }

  // Get user's favorite sports
  getFavoriteSports(): string[] {
    const sportFreq = this.getSportFrequency()
    const sorted = Object.entries(sportFreq).sort(([, a], [, b]) => b - a)

    return sorted.slice(0, 3).map(([sport]) => sport)
  }

  // Calculate user engagement score
  getEngagementScore(): number {
    const now = Date.now()
    const last7Days = this.activities.filter((a) => now - a.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000)

    const score = last7Days.reduce((acc, activity) => {
      const weights = {
        view: 1,
        favorite: 5,
        share: 3,
        notification_open: 2,
      }
      return acc + (weights[activity.action] || 0)
    }, 0)

    return Math.min(score / 100, 1)
  }

  // Get personalized content for home feed
  getPersonalizedFeed(): {
    matches: string[]
    leagues: string[]
    sports: string[]
  } {
    return {
      matches: this.getSuggestedMatches(),
      leagues: this.preferences.favoriteLeagues,
      sports: this.getFavoriteSports(),
    }
  }

  // Clear all data
  clearData() {
    this.activities = []
    this.preferences = {
      favoriteTeams: [],
      favoriteLeagues: [],
      favoriteSports: [],
    }
    this.saveData()
  }
}

export const personalizationEngine = new PersonalizationEngine()
