"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

// Countries where gambling advertising must be suppressed entirely
const GAMBLING_RESTRICTED_COUNTRIES = new Set([
  "US", "AU", "CN", "IN", "BR", // strict jurisdictions
])

// UK under-18 protection — if user has declared under-18, suppress all gambling
const AGE_BAND_KEY = "sf_age_band" // "under18" | "adult" | null

export type AgeBand = "under18" | "adult" | null

export interface ComplianceState {
  ageBand: AgeBand
  countryCode: string | null
  showGambling: boolean
  setAgeBand: (band: AgeBand) => void
}

const ComplianceContext = createContext<ComplianceState>({
  ageBand: null,
  countryCode: null,
  showGambling: false,
  setAgeBand: () => {},
})

export function ComplianceProvider({ children }: { children: ReactNode }) {
  const [ageBand, setAgeBandState] = useState<AgeBand>(null)
  const [countryCode, setCountryCode] = useState<string | null>(null)

  // Load saved age band
  useEffect(() => {
    const saved = localStorage.getItem(AGE_BAND_KEY) as AgeBand
    if (saved) setAgeBandState(saved)
  }, [])

  // Detect country via browser locale as a lightweight proxy
  // A real implementation would use CF-IPCountry header from middleware
  useEffect(() => {
    try {
      const locale = navigator.language || navigator.languages?.[0] || ""
      // Extract region from locale string e.g. "en-US" → "US"
      const region = locale.split("-")[1]?.toUpperCase() ?? null
      if (region) setCountryCode(region)
    } catch {
      // ignore
    }
  }, [])

  const setAgeBand = (band: AgeBand) => {
    setAgeBandState(band)
    if (band) localStorage.setItem(AGE_BAND_KEY, band)
    else localStorage.removeItem(AGE_BAND_KEY)
  }

  const showGambling =
    ageBand !== "under18" &&
    countryCode !== null &&
    !GAMBLING_RESTRICTED_COUNTRIES.has(countryCode)

  return (
    <ComplianceContext.Provider value={{ ageBand, countryCode, showGambling, setAgeBand }}>
      {children}
    </ComplianceContext.Provider>
  )
}

export function useCompliance() {
  return useContext(ComplianceContext)
}
