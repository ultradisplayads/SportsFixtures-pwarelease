import { OwnedBrandHubPage } from "@/components/owned-brand-hub-page"
import { OWNED_BRAND_HUBS } from "@/lib/owned-brand-hubs"
import JsonLd from "@/components/seo/json-ld"
import { buildMetadata } from "@/lib/seo/metadata"
import { brandSchema, breadcrumbSchema } from "@/lib/seo/schema"

const hub = OWNED_BRAND_HUBS.sportsbarz

export const metadata = buildMetadata({
  title: "SportsBarz sports bar and venue discovery",
  description: "SportsBarz helps fans find sports bars and helps venues convert match-night demand inside the SportsFixtures ecosystem.",
  canonical: "https://sportsfixtures.net/sportsbarz",
  keywords: ["SportsBarz", "sports bars", "where to watch sport", "venue discovery", "match night"],
})

export default function SportsBarzPage() {
  return (
    <>
      <JsonLd
        data={[
          brandSchema({
            name: hub.name,
            path: "/sportsbarz",
            description: hub.positioning,
            domain: hub.domain,
            parentName: "SportsFixtures",
          }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "SportsBarz", path: "/sportsbarz" },
          ]),
        ]}
      />
      <OwnedBrandHubPage hub={hub} />
    </>
  )
}
