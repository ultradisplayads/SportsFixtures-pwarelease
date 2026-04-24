import StatCard from "@/components/measurement/stat-card"
import SectionTable from "@/components/measurement/section-table"
import StalePageBadge from "@/components/measurement/stale-page-badge"
import {
  getAiReferralPerformance,
  getConversionPerformance,
  getMeasurementOverview,
  getPageTypePerformance,
  getStalePages,
  getVenueIntentPerformance,
} from "@/lib/measurement/get-measurement-overview"

function EmptySection({
  title,
  message = "No data available yet.",
}: {
  title: string
  message?: string
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
      <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        {message}
      </div>
    </div>
  )
}

export const metadata = {
  title: "Measurement Dashboard | SportsFixtures Admin",
  robots: { index: false, follow: false },
}

export default async function MeasurementDashboardPage() {
  const [overview, pageTypes, aiReferrals, conversions, venueIntent, stalePages] =
    await Promise.all([
      getMeasurementOverview(),
      getPageTypePerformance(),
      getAiReferralPerformance(),
      getConversionPerformance(),
      getVenueIntentPerformance(),
      getStalePages(),
    ])

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Header */}
        <header className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Measurement Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Search, AI referral, Discover, page-type, venue-intent, conversion, and stale-page monitoring.
          </p>
        </header>

        {/* Overview stat grid */}
        <section aria-label="Overview stats">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Overview — {overview.dateRange}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Total Sessions"         value={overview.sessions.toLocaleString()} />
            <StatCard title="Organic Sessions"       value={overview.organicSessions.toLocaleString()} />
            <StatCard title="AI Referral Sessions"   value={overview.aiReferralSessions.toLocaleString()} />
            <StatCard title="Discover Clicks"        value={overview.discoverClicks.toLocaleString()} />
            <StatCard title="Conversions"            value={overview.conversions.toLocaleString()} />
            <StatCard title="Venue Intent Sessions"  value={overview.venueIntentSessions.toLocaleString()} />
            <StatCard
              title="Stale Pages"
              value={overview.stalePages.toLocaleString()}
              subtext="Pages exceeding freshness threshold"
            />
          </div>
        </section>

        {/* Page-type performance */}
        {pageTypes.length === 0 ? (
          <EmptySection title="Page-Type Performance" />
        ) : (
          <SectionTable
            title="Page-Type Performance"
            headers={["Page Type", "Sessions", "Organic", "AI Referrals", "Conversions", "Avg Engagement (s)"]}
            rows={pageTypes.map((row) => [
              <span key={row.pageType} className="font-medium capitalize">{row.pageType}</span>,
              row.sessions.toLocaleString(),
              row.organicSessions.toLocaleString(),
              row.aiReferralSessions.toLocaleString(),
              row.conversions.toLocaleString(),
              row.avgEngagementSeconds.toLocaleString(),
            ])}
          />
        )}

        {/* AI Referrals */}
        {aiReferrals.length === 0 ? (
          <EmptySection title="AI Referrals by Source" />
        ) : (
          <SectionTable
            title="AI Referrals by Source"
            headers={["Source", "Sessions", "Engaged", "Conversions", "Top Paths"]}
            rows={aiReferrals.map((row) => [
              <span key={row.source} className="font-medium capitalize">{row.source.replace("_", " ")}</span>,
              row.sessions.toLocaleString(),
              row.engagedSessions.toLocaleString(),
              row.conversions.toLocaleString(),
              <div key={`${row.source}-paths`} className="space-y-0.5 text-muted-foreground">
                {row.topPaths.map((p) => (
                  <div key={`${row.source}-${p.path}`} className="flex items-center gap-1">
                    <span className="truncate max-w-[160px]">{p.path}</span>
                    <span className="text-xs">({p.sessions})</span>
                  </div>
                ))}
              </div>,
            ])}
          />
        )}

        {/* Venue Intent */}
        {venueIntent.length === 0 ? (
          <EmptySection title="Venue Intent" />
        ) : (
          <SectionTable
            title="Venue Intent"
            headers={["Path", "City", "Sessions", "Watch Here", "Venue Clicks", "Conversions"]}
            rows={venueIntent.map((row) => [
              <span key={row.path} className="font-mono text-xs">{row.path}</span>,
              row.city ?? "—",
              row.sessions.toLocaleString(),
              row.watchHereClicks.toLocaleString(),
              row.venueClicks.toLocaleString(),
              row.conversions.toLocaleString(),
            ])}
          />
        )}

        {/* Conversions */}
        {conversions.length === 0 ? (
          <EmptySection title="Conversions by Type" />
        ) : (
          <SectionTable
            title="Conversions by Type"
            headers={["Conversion Type", "Page Type", "Count"]}
            rows={conversions.map((row) => [
              <span key={row.conversionType} className="font-medium capitalize">{row.conversionType.replace(/_/g, " ")}</span>,
              <span key={`${row.conversionType}-pt`} className="capitalize">{row.pageType}</span>,
              row.count.toLocaleString(),
            ])}
          />
        )}

        {/* Stale Pages */}
        {stalePages.length === 0 ? (
          <EmptySection title="Stale Pages" message="No stale pages detected." />
        ) : (
          <SectionTable
            title="Stale Pages"
            headers={["Severity", "Page Type", "Title", "Path", "Updated", "Age (days)", "Score"]}
            rows={stalePages.map((row) => [
              <StalePageBadge key={`${row.path}-badge`} severity={row.severity} />,
              <span key={`${row.path}-pt`} className="capitalize">{row.pageType}</span>,
              row.title,
              <span key={`${row.path}-path`} className="font-mono text-xs">{row.path}</span>,
              row.updatedAt
                ? new Date(row.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                : "—",
              row.ageDays?.toString() ?? "—",
              <span key={`${row.path}-score`} className={row.staleScore >= 100 ? "font-bold text-destructive" : ""}>{row.staleScore}</span>,
            ])}
          />
        )}

      </div>
    </main>
  )
}
