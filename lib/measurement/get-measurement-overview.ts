import type {
  AiReferralRow,
  ConversionRow,
  MeasurementOverview,
  PageTypePerformanceRow,
  StalePageRow,
  VenueIntentRow,
} from "@/lib/measurement/types"
import {
  fetchAiReferralRows,
  fetchConversionRows,
  fetchDiscoverClicks,
  fetchOrganicAndSessionTotals,
  fetchPageTypeRows,
  fetchStalePageRows,
  fetchVenueIntentRows,
} from "@/lib/measurement/sources"

export async function getMeasurementOverview(): Promise<MeasurementOverview> {
  const [
    totals,
    discoverClicks,
    conversions,
    venueIntent,
    stalePages,
  ] = await Promise.all([
    fetchOrganicAndSessionTotals(),
    fetchDiscoverClicks(),
    fetchConversionRows(),
    fetchVenueIntentRows(),
    fetchStalePageRows(),
  ])

  const totalConversions = conversions.reduce((sum, row) => sum + row.count, 0)
  const totalVenueIntentSessions = venueIntent.reduce(
    (sum, row) => sum + row.sessions,
    0,
  )

  return {
    dateRange: "Last 30 days",
    sessions: totals.sessions,
    organicSessions: totals.organicSessions,
    aiReferralSessions: totals.aiReferralSessions,
    discoverClicks,
    conversions: totalConversions,
    venueIntentSessions: totalVenueIntentSessions,
    stalePages: stalePages.length,
  }
}

export async function getPageTypePerformance(): Promise<PageTypePerformanceRow[]> {
  return fetchPageTypeRows()
}

export async function getAiReferralPerformance(): Promise<AiReferralRow[]> {
  return fetchAiReferralRows()
}

export async function getConversionPerformance(): Promise<ConversionRow[]> {
  return fetchConversionRows()
}

export async function getVenueIntentPerformance(): Promise<VenueIntentRow[]> {
  return fetchVenueIntentRows()
}

export async function getStalePages(): Promise<StalePageRow[]> {
  return fetchStalePageRows()
}
