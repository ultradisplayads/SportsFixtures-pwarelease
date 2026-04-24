// Pure sync utilities for match status — NOT a server action file.
// Imported by both client and server components.

export function getMatchStatus(progress: string): { label: string; isLive: boolean } {
  const statusMap: Record<string, { label: string; isLive: boolean }> = {
    NS:   { label: "Not Started", isLive: false },
    "1H": { label: "1st Half",    isLive: true  },
    HT:   { label: "Half Time",   isLive: true  },
    "2H": { label: "2nd Half",    isLive: true  },
    FT:   { label: "Full Time",   isLive: false },
    AET:  { label: "Extra Time",  isLive: true  },
    PEN:  { label: "Penalties",   isLive: true  },
    CANC: { label: "Cancelled",   isLive: false },
    PST:  { label: "Postponed",   isLive: false },
  }
  return statusMap[progress] || { label: progress, isLive: false }
}
