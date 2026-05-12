"use server"

import { cachedProviderJson } from "@/lib/provider-cache"

export interface TSDBPlayer {
  idPlayer: string
  strPlayer: string
  strPosition?: string
  strTeam?: string
  idTeam?: string
  strTeamBadge?: string
  strThumb?: string
  strCutout?: string
  strBirthLocation?: string
  dateBorn?: string
  strHeight?: string
  strWeight?: string
  strDescriptionEN?: string
  strNationality?: string
  strSigning?: string
  strWage?: string
  strSport?: string
}

export async function getPlayerDetails(playerId: string): Promise<TSDBPlayer | null> {
  try {
    const apiKey = process.env.SPORTSDB_API_KEY || "3"
    const endpoint = `lookupplayer.php?id=${playerId}`
    const data = await cachedProviderJson({
      provider: "sportsdb-v1",
      endpoint: `GET:${endpoint}`,
      ttlSeconds: 3600,
      fetcher: async () => {
        const res = await fetch(
          `https://www.thesportsdb.com/api/v1/json/${apiKey}/${endpoint}`,
          { cache: "no-store" },
        )
        if (!res.ok) return null
        return res.json()
      },
    })
    return data.players?.[0] || null
  } catch {
    return null
  }
}
