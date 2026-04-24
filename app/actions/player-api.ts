"use server"

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
    const res = await fetch(
      `https://www.thesportsdb.com/api/v1/json/${apiKey}/lookupplayer.php?id=${playerId}`,
      { next: { revalidate: 3600 } },
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.players?.[0] || null
  } catch {
    return null
  }
}
