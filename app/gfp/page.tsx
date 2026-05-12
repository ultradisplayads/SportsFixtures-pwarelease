import { OwnedBrandHubPage } from "@/components/owned-brand-hub-page"
import { OWNED_BRAND_HUBS } from "@/lib/owned-brand-hubs"
import JsonLd from "@/components/seo/json-ld"
import { buildMetadata } from "@/lib/seo/metadata"
import { brandSchema, breadcrumbSchema } from "@/lib/seo/schema"

const hub = OWNED_BRAND_HUBS.gfp

export const metadata = buildMetadata({
  title: "GFP food-led sports venue discovery",
  description: "GFP connects food-led venues, sports-night offers and local discovery inside the SportsFixtures ecosystem.",
  canonical: "https://sportsfixtures.net/gfp",
  keywords: ["GFP", "great food places", "sports bars", "venue discovery", "sports night offers"],
})

export default function GFPPage() {
  return (
    <>
      <JsonLd
        data={[
          brandSchema({
            name: hub.name,
            path: "/gfp",
            description: hub.positioning,
            domain: hub.domain,
            parentName: "SportsFixtures",
          }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "GFP", path: "/gfp" },
          ]),
        ]}
      />
      <OwnedBrandHubPage hub={hub} />
    </>
  )
}
