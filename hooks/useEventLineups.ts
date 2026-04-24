import { useState, useEffect } from "react"

export interface Player {
  name: string
  position: string
  image?: string
  country?: string
  goal?: boolean
  goals?: number
  card?: "yellow" | "red"
  subOut?: string
  subPlayer?: string
}

export interface TeamLineup {
  formation: string
  goalkeeper: Player
  defenders: Player[]
  midfielders: Player[]
  forwards: Player[]
  substitutes: Player[]
}

export interface EventLineupsData {
  idEvent: string
  strHomeTeam: string
  strAwayTeam: string
  strHomeTeamBadge: string
  strAwayTeamBadge: string
  homeLineup: TeamLineup
  awayLineup: TeamLineup
}

function toPlayer(raw: any): Player {
  return {
    name: raw?.player || raw?.strPlayer || "Unknown",
    position: raw?.position || raw?.strPosition || raw?.positionShort || "",
    image:
      raw?.strCutout ||
      raw?.strRender ||
      raw?.strThumb ||
      raw?.strFanart1 ||
      undefined,
    country: raw?.strNationality || undefined,
  }
}

function splitByRole(players: any[] = []) {
  const out = {
    goalkeeper: null as Player | null,
    defenders: [] as Player[],
    midfielders: [] as Player[],
    forwards: [] as Player[],
  }
  for (const raw of players) {
    const p = toPlayer(raw)
    const pos = String(raw?.positionShort || raw?.strPosition || "").toUpperCase()
    if (!out.goalkeeper && (pos === "G" || pos === "GK" || pos.includes("KEEP"))) {
      out.goalkeeper = p
    } else if (pos === "D" || pos === "DF" || pos.includes("BACK") || pos.includes("DEF")) {
      out.defenders.push(p)
    } else if (pos === "M" || pos === "MF" || pos.includes("MID")) {
      out.midfielders.push(p)
    } else if (pos === "F" || pos === "FW" || pos.includes("ATT") || pos.includes("STR")) {
      out.forwards.push(p)
    } else if (!out.goalkeeper) {
      out.goalkeeper = p
    } else {
      out.midfielders.push(p)
    }
  }
  return out
}

function buildLineup(teamData: any): TeamLineup {
  const starting: any[] = Array.isArray(teamData?.starting) ? teamData.starting : []
  const subs: any[] = Array.isArray(teamData?.substitutes) ? teamData.substitutes : []
  const roles = splitByRole(starting)
  return {
    formation: teamData?.formation || "TBC",
    goalkeeper: roles.goalkeeper || { name: "TBC", position: "GK" },
    defenders: roles.defenders,
    midfielders: roles.midfielders,
    forwards: roles.forwards,
    substitutes: subs.map(toPlayer),
  }
}

export function useEventLineups(idEvent: string | undefined) {
  const [data, setData] = useState<EventLineupsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!idEvent || !/^\d+$/.test(idEvent)) return

    let cancelled = false
    setLoading(true)
    setError(null)

    // Always use local Next.js proxy routes — never call SF API directly from the client
    Promise.all([
      fetch(`/api/event-lineup/${idEvent}?format=byTeam`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(`/api/events/${idEvent}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([lineupRes, eventRes]) => {
        if (cancelled) return
        if (!lineupRes?.success || !lineupRes?.data) {
          setData(null)
          return
        }
        const raw = lineupRes.data
        const ev = eventRes?.data || {}
        setData({
          idEvent,
          strHomeTeam: ev.strHomeTeam || raw.homeTeam?.name || "Home",
          strAwayTeam: ev.strAwayTeam || raw.awayTeam?.name || "Away",
          strHomeTeamBadge: ev.strHomeTeamBadge || raw.homeTeam?.badge || "",
          strAwayTeamBadge: ev.strAwayTeamBadge || raw.awayTeam?.badge || "",
          homeLineup: buildLineup(raw.homeTeam),
          awayLineup: buildLineup(raw.awayTeam),
        })
      })
      .catch((err) => { if (!cancelled) setError(err) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [idEvent])

  return { data, loading, error }
}
