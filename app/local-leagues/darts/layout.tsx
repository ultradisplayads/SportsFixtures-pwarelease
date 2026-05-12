import type { ReactNode } from "react"
import { buildMetadata } from "@/lib/seo/metadata"
import JsonLd from "@/components/seo/json-ld"
import { breadcrumbSchema } from "@/lib/seo/schema"

export const metadata = buildMetadata({
  title: "Darts leagues, tables and venue fixtures",
  description: "Local darts leagues, standings, fixtures and venue signup for SportsFixtures and PubLeagues.",
  canonical: "https://sportsfixtures.net/local-leagues/darts",
  keywords: ["darts leagues", "pub leagues", "darts tables", "local sports leagues", "venue fixtures"],
})

export default function DartsLeagueLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Local Leagues", path: "/local-leagues/pricing" },
            { name: "Darts", path: "/local-leagues/darts" },
          ]),
        ]}
      />
      {children}
    </>
  )
}

