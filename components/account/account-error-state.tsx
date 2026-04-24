// components/account/account-error-state.tsx
// Section 06 — Typed error display for account/profile surfaces.
// Wraps the existing AccountEmptyState "error" and "unavailable" modes
// under a dedicated named export so import paths are predictable.

import { AccountEmptyState } from "@/components/account/account-empty-state"

interface AccountErrorStateProps {
  /** "error" = network/load failure; "unavailable" = server-confirmed unavailable */
  variant?: "error" | "unavailable"
  onRetry?: () => void
}

export function AccountErrorState({
  variant = "error",
  onRetry,
}: AccountErrorStateProps) {
  return <AccountEmptyState mode={variant} onRetry={onRetry} />
}
