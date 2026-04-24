"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { HeaderMenu } from "@/components/header-menu";
import { BrowseTabs } from "@/components/navigation/browse-tabs";
import { SectionShell } from "@/components/navigation/section-shell";
import { LoadingSkeletonBlock } from "@/components/navigation/loading-skeleton-block";
import { useBrowseState } from "@/hooks/use-browse-state";
import { FixturesList } from "@/components/fixtures-list";
import { LiveMatchesList } from "@/components/live-matches-list";
import { ResultsList } from "@/components/results-list";
import { FixturesFilterProvider } from "@/lib/fixtures-filter-context";
import { SportsSelector } from "@/components/sports-selector";
import { CountriesSelector } from "@/components/countries-selector";
import { LeaguesSelector } from "@/components/leagues-selector";
import { paramToView, hasActiveFilters, browseHref } from "@/lib/navigation";
import { X } from "lucide-react";
import type { BrowseViewMode } from "@/types/navigation";

function ActiveFilterBadges({
  summary,
  onReset,
}: {
  summary: string[];
  onReset: () => void;
}) {
  if (!summary.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {summary.map((label) => (
        <span
          key={label}
          className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
        >
          {label}
        </span>
      ))}
      <button
        onClick={onReset}
        className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
        aria-label="Clear all filters"
      >
        <X className="h-3 w-3" />
        Clear
      </button>
    </div>
  );
}

function BrowseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialView = paramToView(searchParams.get("view"));
  const { state, setView, patch, reset, isFiltered, filterSummary } =
    useBrowseState({
      view: initialView,
      sport: searchParams.get("sport") || null,
      country: searchParams.get("country") || null,
      competitionId: searchParams.get("competition") || null,
    });

  function handleViewChange(next: BrowseViewMode) {
    setView(next);
    // Update URL param without full navigation so state is linkable
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") {
      params.delete("view");
    } else {
      params.set("view", next);
    }
    router.replace(`/browse?${params.toString()}`, { scroll: false });
  }

  const subtitle =
    state.view === "live"
      ? "Matches currently in play"
      : state.view === "fixtures"
      ? "Upcoming scheduled matches"
      : state.view === "results"
      ? "Recently completed matches"
      : "All fixtures, live scores, and results";

  return (
    <FixturesFilterProvider>
      <div className="flex min-h-screen flex-col bg-background pb-20">
        <HeaderMenu />

        <SectionShell
          title="Browse"
          subtitle={subtitle}
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Browse" }]}
        >
          {/* View mode tabs */}
          <BrowseTabs value={state.view} onChange={handleViewChange} />

          {/* Active filter summary + reset */}
          {isFiltered && (
            <ActiveFilterBadges summary={filterSummary} onReset={reset} />
          )}

          {/* Sport / country / league filter strips — only for non-live views */}
          {state.view !== "live" && (
            <div className="rounded-xl border border-border overflow-hidden">
              <SportsSelector />
              <CountriesSelector />
              <LeaguesSelector />
            </div>
          )}
        </SectionShell>

        {/* Content area — switches on view mode */}
        <div className="flex-1">
          {state.view === "live" && (
            <Suspense fallback={<LoadingSkeletonBlock lines={4} />}>
              <LiveMatchesList />
            </Suspense>
          )}

          {state.view === "fixtures" && (
            <Suspense fallback={<LoadingSkeletonBlock lines={4} />}>
              <FixturesList />
            </Suspense>
          )}

          {state.view === "results" && (
            <div className="px-3 py-4">
              <ResultsList
                sport={state.sport ?? undefined}
                competitionId={state.competitionId ?? undefined}
              />
            </div>
          )}

          {state.view === "all" && (
            <Suspense fallback={<LoadingSkeletonBlock lines={4} />}>
              <FixturesList />
            </Suspense>
          )}
        </div>

        <BottomNav />
      </div>
    </FixturesFilterProvider>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<LoadingSkeletonBlock lines={5} />}>
      <BrowseContent />
    </Suspense>
  );
}
