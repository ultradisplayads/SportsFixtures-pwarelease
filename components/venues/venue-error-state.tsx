import { AlertCircle, RefreshCw } from "lucide-react"

interface Props {
  message?: string
  onRetry?: () => void
}

export function VenueErrorState({
  message = "Could not load venues. Please try again.",
  onRetry,
}: Props) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
      <AlertCircle className="h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-sm font-medium text-destructive">Error loading venues</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Retry
        </button>
      )}
    </div>
  )
}
