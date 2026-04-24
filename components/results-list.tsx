"use client"

import useSWR from "swr"
import { ResultsLoadingState } from "@/components/results/results-loading-state"
import { ResultsEmptyState } from "@/components/results/results-empty-state"
import { ResultsErrorState } from "@/components/results/results-error-state"
import type { ResultRow } from "@/lib/results"

const fetcher = (url: string) => fetch(url).then((r) => {
  if (!r.ok) throw new Error("Failed to load results")
  return r.json()
})

export function ResultsList({
  sport,
  competitionId,
  teamId,
  date,
}: {
  sport?: string
  competitionId?: string
  teamId?: string
  date?: string
}) {
  const qs = new URLSearchParams()
  if (sport) qs.set("sport", sport)
  if (competitionId) qs.set("competitionId", competitionId)
  if (teamId) qs.set("teamId", teamId)
  if (date) qs.set("date", date)

  const { data, error, isLoading } = useSWR<{ items: ResultRow[] }>(
    `/api/results?${qs.toString()}`,
    fetcher,
    { revalidateOnFocus: false },
  )

  if (isLoading) return <ResultsLoadingState />
  if (error) return <ResultsErrorState />

  const items = data?.items ?? []
  if (!items.length) return <ResultsEmptyState />

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article
          key={item.id}
          className="rounded-3xl border border-white/10 bg-white/5 p-4"
        >
          {item.competitionName ? (
            <div className="mb-2 text-xs uppercase tracking-wide text-white/45">
              {item.competitionName}
            </div>
          ) : null}
          <div className="text-sm font-semibold text-white/90">
            {item.homeTeamName}{" "}
            {typeof item.homeScore === "number" ? item.homeScore : ""}
            {typeof item.homeScore === "number" || typeof item.awayScore === "number"
              ? " - "
              : " vs "}
            {typeof item.awayScore === "number" ? item.awayScore : ""}{" "}
            {item.awayTeamName}
          </div>
          <div className="mt-1 text-xs text-white/55">
            {item.status || "Finished"}
            {item.finishedAt ? ` \u2022 ${item.finishedAt}` : ""}
          </div>
        </article>
      ))}
    </div>
  )
}
