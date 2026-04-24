// Date utilities — timezone-accurate kick-off and in-play time display
// TheSportsDB stores dateEvent as YYYY-MM-DD and strTime as HH:MM:SS in UTC

export interface ParsedDate {
  date: Date | null
  isValid: boolean
  formatted: string
  error?: string
}

/**
 * Parse a date+time from TheSportsDB. Times are UTC.
 */
export function parseSportsDate(
  dateString: string | null | undefined,
  timeString?: string | null,
): ParsedDate {
  if (!dateString) {
    return { date: null, isValid: false, formatted: "TBD" }
  }

  try {
    const cleanDate = dateString.trim()

    if (timeString && timeString.trim()) {
      // Combine as UTC ISO string
      const cleanTime = timeString.trim().substring(0, 5) // HH:MM
      const isoString = `${cleanDate}T${cleanTime}:00Z` // explicit UTC
      const date = new Date(isoString)

      if (isNaN(date.getTime())) throw new Error("Invalid date/time")

      return {
        date,
        isValid: true,
        formatted: date.toLocaleDateString(undefined, {
          weekday: "long",
          day: "numeric",
          month: "long",
        }),
      }
    }

    // Date only — treat as UTC midnight
    const date = new Date(`${cleanDate}T00:00:00Z`)
    if (isNaN(date.getTime())) throw new Error("Invalid date")

    return {
      date,
      isValid: true,
      formatted: date.toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    }
  } catch (error) {
    return {
      date: null,
      isValid: false,
      formatted: "Date TBD",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Format kick-off time showing:
 *  - local time (user's device timezone)
 *  - UK time (for event reference)
 *  - Thai time (ICT = UTC+7) when relevant
 *
 * Returns both times so the UI can show "19:45 local / 13:45 UK"
 */
export function formatTimeWithTimezones(
  dateString: string,
  timeString: string,
): {
  local: string         // user's local time
  localFull: string     // e.g. "19:45 ICT"
  uk: string            // UK kick-off time
  tz: string            // user's IANA timezone abbreviation
  showBoth: boolean     // true when user is not in UK
  isValid: boolean
} {
  const parsed = parseSportsDate(dateString, timeString)

  if (!parsed.isValid || !parsed.date) {
    return { local: "TBD", localFull: "TBD", uk: "TBD", tz: "", showBoth: false, isValid: false }
  }

  const d = parsed.date
  const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone

  const local = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: userTz,
  })

  const uk = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/London",
  })

  // Short TZ abbreviation e.g. "ICT", "BST", "CET"
  const tzAbbr = new Intl.DateTimeFormat("en-US", { timeZoneName: "short", timeZone: userTz })
    .formatToParts(d)
    .find((p) => p.type === "timeZoneName")?.value || userTz

  const isUK = userTz === "Europe/London" || userTz === "Europe/Belfast"

  return {
    local,
    localFull: `${local} ${tzAbbr}`,
    uk,
    tz: tzAbbr,
    showBoth: !isUK,
    isValid: true,
  }
}

/**
 * Format in-play time: returns e.g. "67'" for football, "Q3 8:24" for basketball
 */
export function formatInPlayTime(progress: string | null | undefined): {
  display: string
  isLive: boolean
  isFinished: boolean
  color: "green" | "red" | "yellow" | "grey"
} {
  if (!progress) return { display: "NS", isLive: false, isFinished: false, color: "grey" }

  const p = progress.toUpperCase().trim()

  const finished = ["FT", "AET", "PEN", "AWD", "WO"]
  if (finished.includes(p)) return { display: p, isLive: false, isFinished: true, color: "red" }

  if (p === "HT") return { display: "HT", isLive: true, isFinished: false, color: "yellow" }
  if (p === "NS") return { display: "NS", isLive: false, isFinished: false, color: "grey" }
  if (p === "CANC") return { display: "CANC", isLive: false, isFinished: false, color: "grey" }
  if (p === "PST" || p === "PP") return { display: "PST", isLive: false, isFinished: false, color: "grey" }

  // Live: 1H, 2H, or a numeric minute
  return { display: p.replace("H", ""), isLive: true, isFinished: false, color: "green" }
}

/**
 * Relative time (e.g. "2h ago")
 */
export function getRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}
