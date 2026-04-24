import { EMPTY_STATE_COPY } from "@/lib/empty-state-copy"

export function ResultsErrorState() {
  return (
    <div className="rounded-3xl border border-red-400/20 bg-red-400/5 p-5">
      <div className="text-sm font-semibold text-red-200">
        {EMPTY_STATE_COPY.resultsUnavailable.title}
      </div>
      <div className="mt-1 text-sm text-red-100/80">
        {EMPTY_STATE_COPY.resultsUnavailable.body}
      </div>
    </div>
  )
}
