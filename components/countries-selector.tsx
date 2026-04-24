"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { getSFCountries, type SFCountry } from "@/lib/sf-api"
import { useFixturesFilter, detectUserCountry } from "@/lib/fixtures-filter-context"

// flagcdn.com — reliable, no API key, serves PNG flags at multiple sizes
function flagUrl(code: string): string {
  return `https://flagcdn.com/w80/${code.toLowerCase()}.png`
}

const PRIORITY: SFCountry[] = [
  { id: "th", slug: "thailand",       name: "Thailand",       countryCode: "TH" },
  { id: "gb", slug: "united-kingdom", name: "United Kingdom", countryCode: "GB" },
  { id: "es", slug: "spain",          name: "Spain",          countryCode: "ES" },
  { id: "de", slug: "germany",        name: "Germany",        countryCode: "DE" },
  { id: "it", slug: "italy",          name: "Italy",          countryCode: "IT" },
  { id: "fr", slug: "france",         name: "France",         countryCode: "FR" },
  { id: "us", slug: "usa",            name: "USA",            countryCode: "US" },
  { id: "br", slug: "brazil",         name: "Brazil",         countryCode: "BR" },
  { id: "ar", slug: "argentina",      name: "Argentina",      countryCode: "AR" },
  { id: "pt", slug: "portugal",       name: "Portugal",       countryCode: "PT" },
  { id: "nl", slug: "netherlands",    name: "Netherlands",    countryCode: "NL" },
  { id: "mx", slug: "mexico",         name: "Mexico",         countryCode: "MX" },
]

export function CountriesSelector() {
  const detectedCountry = detectUserCountry()
  const { selectedCountry, setCountry } = useFixturesFilter()
  const [countries, setCountries] = useState<SFCountry[]>(PRIORITY)
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set())

  useEffect(() => {
    getSFCountries().then((data) => {
      if (data.length > 0) {
        const th   = data.find(c => (c.name || "").toLowerCase().includes("thai"))
        const rest = data.filter(c => !(c.name || "").toLowerCase().includes("thai"))
        setCountries(th ? [th, ...rest] : rest)
      }
    })
    setCountry(detectedCountry)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleClick = (key: string) => {
    triggerHaptic("selection")
    setCountry(key)
    document.querySelector('[data-section="fixtures"]')
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-border bg-background">
      <div className="flex gap-1 px-1 py-1" style={{ width: "max-content" }}>
        {countries.map((country) => {
          const key    = country.slug || String(country.id)
          const name   = country.name || country.strCountry || ""
          const code   = country.countryCode || ""
          const hasErr = imgErrors.has(key)
          // Use Strapi flag if available, otherwise jsdelivr SVG
          const src    = !hasErr
            ? (country.flag || country.strFlag || (code ? flagUrl(code) : null))
            : null
          const active = selectedCountry === key

          return (
            <button
              key={key}
              onClick={() => handleClick(key)}
              aria-label={name}
              title={name}
              style={active ? {
                boxShadow: "0 0 0 2px #378ADD, 0 0 0 3.5px var(--color-background-primary)",
                borderRadius: "10px",
              } : { borderRadius: "10px" }}
              className={`relative shrink-0 h-12 w-12 overflow-hidden transition-opacity
                ${active ? "opacity-100" : "opacity-60 hover:opacity-90"}`}
            >
              {src ? (
                <Image
                  src={src}
                  alt={name}
                  fill
                  className="object-cover"
                  style={{ objectPosition: "center" }}
                  unoptimized
                  onError={() => setImgErrors(prev => new Set(prev).add(key))}
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-muted text-sm font-bold text-muted-foreground">
                  {code.slice(0, 2)}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
