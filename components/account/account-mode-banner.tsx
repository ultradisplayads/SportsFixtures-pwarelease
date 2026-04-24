// components/account/account-mode-banner.tsx
// Clearly communicates whether the user is signed in or using device-based mode.
// Never shames anonymous mode — calm and informative tone only.

import { Smartphone, User } from "lucide-react"
import { getAccountModeLabel, getAccountModeDescription } from "@/lib/account"
import type { AccountMode } from "@/types/account"

interface AccountModeBannerProps {
  mode: AccountMode
  email?: string | null
  onSignIn?: () => void
}

export function AccountModeBanner({ mode, email, onSignIn }: AccountModeBannerProps) {
  const isSignedIn = mode === "signed_in"

  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-4 ${
      isSignedIn
        ? "border-primary/20 bg-primary/5"
        : "border-border bg-muted/40"
    }`}>
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
        isSignedIn ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
      }`}>
        {isSignedIn
          ? <User className="h-4 w-4" />
          : <Smartphone className="h-4 w-4" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">
          {getAccountModeLabel(mode)}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {getAccountModeDescription(mode, email)}
        </p>
        {!isSignedIn && onSignIn && (
          <button
            onClick={onSignIn}
            className="mt-2 text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            Sign in to sync your data
          </button>
        )}
      </div>
    </div>
  )
}
