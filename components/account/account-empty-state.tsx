// components/account/account-empty-state.tsx
// Graceful empty/error states for the profile page.
// Anonymous mode is handled intentionally — not treated as an error.

import { WifiOff, Smartphone, ShieldOff, RefreshCw } from "lucide-react"

interface AccountEmptyStateProps {
  mode?: "error" | "anonymous" | "unavailable"
  onRetry?: () => void
}

const CONFIG = {
  error: {
    icon: WifiOff,
    title: "Could not load account details",
    body: "Your account details could not be loaded right now. Check your connection and try again.",
    showRetry: true,
  },
  anonymous: {
    icon: Smartphone,
    title: "Using device-based mode",
    body: "You are currently using SportsFixtures without a signed-in account. Your preferences are stored on this device.",
    showRetry: false,
  },
  unavailable: {
    icon: ShieldOff,
    title: "Account controls unavailable",
    body: "Account controls are not available right now. Please try again later.",
    showRetry: true,
  },
} as const

export function AccountEmptyState({ mode = "error", onRetry }: AccountEmptyStateProps) {
  const { icon: Icon, title, body, showRetry } = CONFIG[mode]

  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center space-y-3">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      )}
    </div>
  )
}
