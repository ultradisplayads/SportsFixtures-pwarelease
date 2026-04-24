"use client"

import { useState, useMemo } from "react"
import { useMatchCenter } from "@/hooks/use-match-center"
import { shouldShowTab } from "@/lib/match-intelligence"
import { isLivePhase, deriveMatchStatusPhase } from "@/lib/match-intelligence"
import { isFeatureSupported, type CoverageFeature } from "@/lib/coverage-matrix"
import { MatchOverview } from "./match-overview"
import { MatchLineups } from "./match-lineups"
import { MatchStats } from "./match-stats"
import { MatchTimeline } from "./match-timeline"
import { MatchH2H } from "./match-h2h"
import { MatchVideos } from "./match-videos"
import { MatchTickets } from "./match-tickets"
import { MatchOdds } from "./match-odds"
import { MatchTv } from "./match-tv"
import { MatchStandings } from "./match-standings"
import { InsightsPanel } from "@/components/match-center/insights-panel"
import { MatchPrediction } from "../match-prediction"
import { FindPlacesToWatch } from "@/components/venues/find-places-to-watch"
import { useLocation } from "@/components/location-provider"
import { triggerHaptic } from "@/lib/haptic-feedback"
import type { MatchCenterTab } from "@/types/match-intelligence"

interface MatchTabsProps {
  matchId: string
}

// ── Ordered tab definition ────────────────────────────────────────────────────
// Tabs are always rendered in this order.
// Tabs with an `alwaysShow: true` are always visible.
// All others are gated via shouldShowTab() against their envelope.

const ALL_TABS: Array<{
  id: MatchCenterTab
  label: string
  alwaysShow?: boolean
  /** Coverage feature key — used to gate tabs that can be "unsupported" per sport. */
  coverageFeature?: CoverageFeature
}> = [
  { id: "overview",   label: "Overview",   alwaysShow: true },
  { id: "lineups",    label: "Lineups",    coverageFeature: "lineups" },
  { id: "timeline",   label: "Timeline",   coverageFeature: "timeline" },
  { id: "stats",      label: "Stats",      coverageFeature: "stats" },
  { id: "standings",  label: "Standings",  coverageFeature: "standings" },
  { id: "tv",         label: "TV",         coverageFeature: "tv" },
  { id: "highlights", label: "Videos",     coverageFeature: "highlights" },
  { id: "insights",   label: "Insights",   coverageFeature: "insights" },
  { id: "h2h",        label: "H2H",        alwaysShow: true, coverageFeature: "h2h" },
  { id: "predict",    label: "Predict",    alwaysShow: true },
  { id: "odds",       label: "Odds",       alwaysShow: true, coverageFeature: "odds" },
  { id: "tickets",    label: "Tickets",    alwaysShow: true, coverageFeature: "tickets" },
  { id: "venues",     label: "Watch Here", alwaysShow: true, coverageFeature: "venues" },
]

export function MatchTabs({ matchId }: MatchTabsProps) {
  const { data, isLoading } = useMatchCenter(matchId, {
    // Enable live polling only when the match is actually live (checked after first load)
    pollIntervalMs: 0,
  })
  const { location } = useLocation()

  const [activeTab, setActiveTab] = useState<MatchCenterTab>("overview")

  // Derive event state for live polling decision
  const isLive = useMemo(() => {
    const ev = data?.event?.data
    if (!ev) return false
    const phase = deriveMatchStatusPhase({
      status: ev.strProgress || ev.strStatus,
    })
    return isLivePhase(phase)
  }, [data])

  // Derive sport + competitionId for coverage gating (available after first load)
  const evSport = data?.event?.data?.strSport?.toLowerCase() ?? null
  const evCompetitionId = data?.event?.data?.idLeague ? String(data.event.data.idLeague) : null

  // Build the list of visible tabs using shouldShowTab for data-backed tabs.
  // Section 11: also gates on coverage matrix — tabs for "unsupported" features
  // are hidden even when alwaysShow is true, because showing an empty dead shell
  // for genuinely unsupported features degrades trust.
  const visibleTabs = useMemo(() => {
    return ALL_TABS.filter((tab) => {
      // Coverage gate: hide tabs for features the coverage matrix marks unsupported
      // for this sport/competition. Only applied once data (and thus sport) is known.
      if (tab.coverageFeature && evSport) {
        if (!isFeatureSupported(tab.coverageFeature, evSport, evCompetitionId)) {
          return false
        }
      }

      if (tab.alwaysShow) return true
      if (isLoading) return false // while loading don't show gated tabs yet
      if (!data) return false

      switch (tab.id) {
        case "lineups":   return shouldShowTab(data.lineups)
        case "timeline":  return shouldShowTab(data.timeline)
        case "stats":     return shouldShowTab(data.stats)
        case "standings": return shouldShowTab(data.standings)
        case "tv":        return shouldShowTab(data.tv)
        case "highlights":return shouldShowTab(data.highlights)
        case "insights":  return shouldShowTab(data.insights)
        default:          return true
      }
    })
  }, [data, isLoading, evSport, evCompetitionId])

  // Ensure activeTab stays valid after tabs load
  const resolvedActive = useMemo(() => {
    if (visibleTabs.some((t) => t.id === activeTab)) return activeTab
    return "overview"
  }, [activeTab, visibleTabs])

  const handleTabClick = (tabId: MatchCenterTab) => {
    triggerHaptic("selection")
    setActiveTab(tabId)
  }

  // Legacy data for non-match-center tabs that still use their own fetching
  const ev = data?.event?.data
  const legacyMatchData = ev
    ? {
        homeTeamId: ev.idHomeTeam ?? "",
        awayTeamId: ev.idAwayTeam ?? "",
        homeTeam: ev.strHomeTeam,
        awayTeam: ev.strAwayTeam,
        homeLogo: ev.strHomeTeamBadge || "",
        awayLogo: ev.strAwayTeamBadge || "",
        leagueId: ev.idLeague,
        venue: ev.strVenue || "Stadium TBD",
        date: ev.dateEvent || "",
      }
    : null

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="flex overflow-x-auto border-b border-border bg-card scrollbar-hide">
        {(isLoading ? [{ id: "overview" as MatchCenterTab, label: "Overview" }] : visibleTabs).map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              resolvedActive === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
        {/* Live indicator chip */}
        {isLive && (
          <div className="ml-auto flex shrink-0 items-center pr-4">
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[11px] font-semibold text-green-600 dark:text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          </div>
        )}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto bg-secondary/20">
        {resolvedActive === "overview" && (
          <MatchOverview
            eventEnvelope={data?.event ?? null}
            timelineEnvelope={data?.timeline ?? null}
            statsEnvelope={data?.stats ?? null}
            isLoading={isLoading}
          />
        )}

        {resolvedActive === "lineups" && (
          <MatchLineups
            envelope={data?.lineups ?? null}
            isLoading={isLoading}
          />
        )}

        {resolvedActive === "timeline" && (
          <MatchTimeline
            envelope={data?.timeline ?? null}
            isLoading={isLoading}
          />
        )}

        {resolvedActive === "stats" && (
          <MatchStats
            envelope={data?.stats ?? null}
            isLoading={isLoading}
            homeTeamName={ev?.strHomeTeam}
            awayTeamName={ev?.strAwayTeam}
          />
        )}

        {resolvedActive === "standings" && (
          <MatchStandings
            envelope={data?.standings ?? null}
            isLoading={isLoading}
          />
        )}

        {resolvedActive === "tv" && (
          <MatchTv
            envelope={data?.tv ?? null}
            isLoading={isLoading}
          />
        )}

        {resolvedActive === "highlights" && (
          // MatchVideos still handles its own fetching (YouTube embeds, highlights feed)
          // It is NOT replaced — the envelope from match-center is highlights-level context only
          <MatchVideos matchId={matchId} />
        )}

        {resolvedActive === "insights" && data?.insights && (
          <InsightsPanel envelope={data.insights} />
        )}

        {resolvedActive === "h2h" && legacyMatchData && (
          <MatchH2H
            homeTeamId={legacyMatchData.homeTeamId}
            awayTeamId={legacyMatchData.awayTeamId}
            leagueId={legacyMatchData.leagueId}
          />
        )}

        {resolvedActive === "predict" && legacyMatchData && (
          <div className="p-4">
            <MatchPrediction
              matchId={matchId}
              homeTeam={legacyMatchData.homeTeam}
              awayTeam={legacyMatchData.awayTeam}
              homeLogo={legacyMatchData.homeLogo}
              awayLogo={legacyMatchData.awayLogo}
            />
          </div>
        )}

        {resolvedActive === "odds" && legacyMatchData && (
          <MatchOdds
            matchId={matchId}
            homeTeam={legacyMatchData.homeTeam}
            awayTeam={legacyMatchData.awayTeam}
          />
        )}

        {resolvedActive === "tickets" && legacyMatchData && (
          <MatchTickets
            homeTeam={legacyMatchData.homeTeam}
            awayTeam={legacyMatchData.awayTeam}
            venue={legacyMatchData.venue}
            date={legacyMatchData.date}
          />
        )}

        {resolvedActive === "venues" && (
          <FindPlacesToWatch
            eventId={matchId}
            sport={ev?.strSport?.toLowerCase()}
            competitionId={ev?.idLeague}
            lat={location ? Number(location.latitude) : undefined}
            lng={location ? Number(location.longitude) : undefined}
          />
        )}
      </div>
    </div>
  )
}
