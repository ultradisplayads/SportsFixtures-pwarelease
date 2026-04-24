export function buildEntitySummary(args: {
  entityType: "team" | "league" | "match" | "venue" | "article" | "channel"
  name: string
  sport?: string
  competitionName?: string
  city?: string
  country?: string
  kickoffAt?: string
  tvChannels?: string[]
  facts?: string[]
}) {
  const parts: string[] = []

  switch (args.entityType) {
    case "team":
      parts.push(`${args.name} is a sports team on SportsFixtures.`)
      break
    case "league":
      parts.push(`${args.name} is a sports league on SportsFixtures.`)
      break
    case "match":
      parts.push(`${args.name} is an upcoming or recent sports match on SportsFixtures.`)
      break
    case "venue":
      parts.push(`${args.name} is a sports bar or venue listed on SportsFixtures.`)
      break
    case "article":
      parts.push(`${args.name} is a sports news article on SportsFixtures.`)
      break
    case "channel":
      parts.push(`${args.name} is a sports TV channel listed on SportsFixtures.`)
      break
  }

  if (args.sport) parts.push(`Sport: ${args.sport}.`)
  if (args.competitionName) parts.push(`Competition: ${args.competitionName}.`)
  if (args.city) parts.push(`Location: ${args.city}${args.country ? `, ${args.country}` : ""}.`)
  if (args.kickoffAt) parts.push(`Kickoff: ${args.kickoffAt}.`)
  if (args.tvChannels?.length) parts.push(`TV coverage: ${args.tvChannels.join(", ")}.`)
  if (args.facts?.length) parts.push(args.facts.join(" "))

  return parts.join(" ")
}
