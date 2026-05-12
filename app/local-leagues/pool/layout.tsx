import type { ReactNode } from "react"
import { buildMetadata } from "@/lib/seo/metadata"
import JsonLd from "@/components/seo/json-ld"
import { breadcrumbSchema } from "@/lib/seo/schema"

export const metadata = buildMetadata({
  title: "Pool leagues, tables and venue fixtures",
  description: "Local pool leagues, standings, fixtures and venue signup for SportsFixtures and PubLeagues.",
  canonical: "https://sportsfixtures.net/local-leagues/pool",
  keywords: ["pool leagues", "pub leagues", "pool tables", "local sports leagues", "venue fixtures"],
})

export default function PoolLeagueLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Local Leagues", path: "/local-leagues/pricing" },
            { name: "Pool", path: "/local-leagues/pool" },
          ]),
        ]}
      />
      {children}
    </>
  )
}

