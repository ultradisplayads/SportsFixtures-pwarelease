import type { NotificationCategory, ReminderOffset } from "@/types/notifications"

export const SPORTS_APP_REMINDER_OFFSETS: Array<{ value: ReminderOffset; label: string; priority: number }> = [
  { value: "24h", label: "1 day", priority: 10 },
  { value: "12h", label: "12 hours", priority: 20 },
  { value: "8h", label: "8 hours", priority: 30 },
  { value: "3h", label: "3 hours", priority: 40 },
  { value: "1h", label: "1 hour", priority: 50 },
  { value: "30m", label: "30 minutes", priority: 60 },
  { value: "15m", label: "15 minutes", priority: 70 },
  { value: "5m", label: "5 minutes", priority: 80 },
]

export const SPORTS_APP_ALERT_CATEGORIES: Array<{
  id: NotificationCategory
  label: string
  description: string
  tier: 1 | 2 | 3
  commercial?: boolean
}> = [
  { id: "goal", label: "Goals", description: "Instant goal alerts", tier: 1 },
  { id: "red_card", label: "Red cards", description: "Instant red card alerts", tier: 1 },
  { id: "full_time", label: "Full time", description: "Final score when the match ends", tier: 1 },
  { id: "breaking_news", label: "Breaking news", description: "Major news for followed teams and competitions", tier: 1 },
  { id: "kickoff", label: "Kick-off", description: "Alert when a match starts", tier: 2 },
  { id: "lineups", label: "Lineups", description: "Confirmed lineups before kick-off", tier: 2 },
  { id: "predicted_lineups", label: "Predicted lineups", description: "Likely team news before confirmed lineups", tier: 2 },
  { id: "half_time", label: "Half time", description: "Score at the break", tier: 2 },
  { id: "yellow_card", label: "Yellow cards", description: "Card alerts for followed matches", tier: 2 },
  { id: "substitution", label: "Substitutions", description: "Substitution alerts for followed matches", tier: 2 },
  { id: "extra_time", label: "Extra time", description: "Alert when extra time begins", tier: 2 },
  { id: "penalties", label: "Penalties", description: "Penalty shootout alerts", tier: 2 },
  { id: "postponed", label: "Postponed", description: "Schedule disruption alerts", tier: 2 },
  { id: "cancelled", label: "Cancelled", description: "Cancelled match alerts", tier: 2 },
  { id: "match_reminder", label: "Match reminders", description: "Alerts before kick-off at your chosen times", tier: 3 },
  { id: "match_preview", label: "Match previews", description: "Build-up content for followed teams", tier: 3 },
  { id: "video_highlights", label: "Highlights", description: "Video and post-match highlight alerts", tier: 3 },
  { id: "transfer_news", label: "Transfer news", description: "Rumours and confirmed signings for followed teams", tier: 3 },
  { id: "player_news", label: "Player news", description: "Injury, selection, and player-specific updates", tier: 3 },
  { id: "venue_recommendation", label: "Nearby sports bars", description: "Relevant venues showing your teams nearby", tier: 3, commercial: true },
  { id: "venue_offer", label: "Venue offers", description: "Sports bar and restaurant offers near you", tier: 3, commercial: true },
  { id: "partner_offer", label: "Partner offers", description: "SportsFixtures, Pattyaya1, and GreatFoodPlaces offers", tier: 3, commercial: true },
  { id: "geofence_offer", label: "Area offers", description: "Geo-targeted offers when you are near a venue area", tier: 3, commercial: true },
]

export const DEFAULT_PUSH_CATEGORIES: NotificationCategory[] = [
  "goal",
  "red_card",
  "full_time",
  "kickoff",
  "lineups",
  "match_reminder",
  "venue_recommendation",
  "venue_offer",
  "partner_offer",
]

export const DEFAULT_REMINDER_OFFSETS: ReminderOffset[] = ["24h", "8h", "1h", "5m"]
