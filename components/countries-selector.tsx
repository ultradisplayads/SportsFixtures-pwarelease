"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { triggerHaptic } from "@/lib/haptic-feedback"
import type { SFCountry } from "@/lib/sf-api"
import { useFixturesFilter, detectUserCountry } from "@/lib/fixtures-filter-context"

// flagcdn.com — reliable, no API key, serves PNG flags at multiple sizes
function flagUrl(code: string): string {
  return `https://flagcdn.com/w80/${code.toLowerCase()}.png`
}

const EXCLUDED_COUNTRY_SLUGS = new Set([
  "united-kingdom",
  "israel",
  "europe",
  "world",
  "worldwide",
  "international",
  "mixed",
])

const COUNTRY_ORDER = [
  "thailand",
  "england",
  "scotland",
  "wales",
  "northern-ireland",
  "united-states",
  "spain",
  "germany",
  "italy",
  "france",
  "brazil",
  "argentina",
  "portugal",
  "netherlands",
  "mexico",
  "india",
  "japan",
  "australia",
  "canada",
]

const COUNTRY_CODES: Record<string, string> = {
  thailand: "TH",
  england: "gb-eng",
  scotland: "gb-sct",
  wales: "gb-wls",
  "northern-ireland": "gb-nir",
  "united-states": "US",
  usa: "US",
  spain: "ES",
  germany: "DE",
  italy: "IT",
  france: "FR",
  brazil: "BR",
  argentina: "AR",
  portugal: "PT",
  netherlands: "NL",
  "the-netherlands": "NL",
  mexico: "MX",
  india: "IN",
  japan: "JP",
  australia: "AU",
  canada: "CA",
}

const PRIORITY: SFCountry[] = [
  { id: "th", slug: "thailand",       name: "Thailand",       countryCode: "TH" },
  { id: "eng", slug: "england",       name: "England",        countryCode: "gb-eng" },
  { id: "sco", slug: "scotland",      name: "Scotland",       countryCode: "gb-sct" },
  { id: "wal", slug: "wales",         name: "Wales",          countryCode: "gb-wls" },
  { id: "nir", slug: "northern-ireland", name: "Northern Ireland", countryCode: "gb-nir" },
  { id: "us", slug: "united-states",  name: "United States",  countryCode: "US" },
  { id: "es", slug: "spain",          name: "Spain",          countryCode: "ES" },
  { id: "de", slug: "germany",        name: "Germany",        countryCode: "DE" },
  { id: "it", slug: "italy",          name: "Italy",          countryCode: "IT" },
  { id: "fr", slug: "france",         name: "France",         countryCode: "FR" },
  { id: "br", slug: "brazil",         name: "Brazil",         countryCode: "BR" },
  { id: "ar", slug: "argentina",      name: "Argentina",      countryCode: "AR" },
  { id: "pt", slug: "portugal",       name: "Portugal",       countryCode: "PT" },
  { id: "nl", slug: "netherlands",    name: "Netherlands",    countryCode: "NL" },
  { id: "mx", slug: "mexico",         name: "Mexico",         countryCode: "MX" },
]

const COUNTRIES_CACHE_KEY = "sf_selector_countries_v2"

function countryRank(country: SFCountry, detectedCountry: string): number {
  const slug = String(country.slug || "")
  if (slug === detectedCountry) return -1
  const rank = COUNTRY_ORDER.indexOf(slug)
  return rank === -1 ? Number.MAX_SAFE_INTEGER : rank
}

function isAllowedCountry(country: SFCountry): boolean {
  const slug = String(country.slug || "").toLowerCase()
  const name = String(country.name || country.strCountry || "").toLowerCase()
  return !EXCLUDED_COUNTRY_SLUGS.has(slug) && !slug.includes("israel") && !name.includes("israel")
}

function readCachedCountries(): SFCountry[] {
  if (typeof window === "undefined") return PRIORITY
  try {
    const cached = JSON.parse(window.localStorage.getItem(COUNTRIES_CACHE_KEY) || "[]")
    return Array.isArray(cached) && cached.length > 0 ? cached : PRIORITY
  } catch {
    return PRIORITY
  }
}

export function CountriesSelector() {
  const detectedCountry = detectUserCountry()
  const { selectedCountry, setCountry } = useFixturesFilter()
  const router = useRouter()
  const [countries, setCountries] = useState<SFCountry[]>(readCachedCountries)
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch("/api/countries")
      .then((res) => res.json())
      .then((data) => {
        const countries = Array.isArray(data.countries)
          ? data.countries
              .map((c: any) => {
                const rawSlug = c.slug || ""
                const slug = rawSlug === "the-netherlands" ? "netherlands" : rawSlug
                const name = c.label === "The Netherlands" ? "Netherlands" : c.label
                return {
                  id: c.id,
                  slug,
                  name,
                  strCountry: name,
                  countryCode: c.code || COUNTRY_CODES[slug],
                  flag: c.logo,
                  strFlag: c.logo,
                }
              })
              .filter(isAllowedCountry)
              .sort((a: SFCountry, b: SFCountry) => {
                const rank = countryRank(a, detectedCountry) - countryRank(b, detectedCountry)
                if (rank !== 0) return rank
                return String(a.name || a.strCountry || "").localeCompare(String(b.name || b.strCountry || ""))
              })
          : []

        if (countries.length > 0) {
          setCountries(countries)
          window.localStorage.setItem(COUNTRIES_CACHE_KEY, JSON.stringify(countries))
        }
      })
      .catch((error) => console.error("[CountriesSelector] Failed to load countries", error))
    setCountry(EXCLUDED_COUNTRY_SLUGS.has(detectedCountry) ? "thailand" : detectedCountry)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleClick = (key: string) => {
    triggerHaptic("selection")
    setCountry(key)
    router.push(`/fixtures?country=${encodeURIComponent(key)}`)
    document.querySelector('[data-section="fixtures"]')
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="w-full overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-border bg-background">
      <div className="flex min-w-full gap-1.5 px-2 py-1.5" style={{ width: "max-content" }}>
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
              className={`relative h-12 w-12 shrink-0 overflow-hidden transition duration-200 ease-out active:scale-95
                ${active ? "opacity-100" : "opacity-75 hover:scale-105 hover:opacity-100"}`}
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
