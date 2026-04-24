import { EMPTY_STATE_COPY } from "@/lib/empty-state-copy"

export function ResultsEmptyState() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="text-sm font-semibold text-white/90">
        {EMPTY_STATE_COPY.resultsEmpty.title}
      </div>
      <div className="mt-1 text-sm text-white/60">
        {EMPTY_STATE_COPY.resultsEmpty.body}
      </div>
    </div>
  )
}
