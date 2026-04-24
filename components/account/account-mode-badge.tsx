// components/account/account-mode-badge.tsx
// Section 06 — Compact inline badge for account mode.
// Use this in headers and summary cards where the full AccountModeBanner
// is too tall. Renders a small pill indicating signed-in vs device-based.

import { Smartphone, User } from "lucide-react"
import type { AccountMode } from "@/types/account"

interface AccountModeBadgeProps {
  mode: AccountMode
  className?: string
}

export function AccountModeBadge({ mode, className = "" }: AccountModeBadgeProps) {
  const isSignedIn = mode === "signed_in"

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none ${
        isSignedIn
          ? "border-primary/30 bg-primary/8 text-primary"
          : "border-border bg-muted/60 text-muted-foreground"
      } ${className}`}
      aria-label={isSignedIn ? "Signed-in account" : "Device-based mode"}
    >
      {isSignedIn
        ? <User className="h-2.5 w-2.5" aria-hidden="true" />
        : <Smartphone className="h-2.5 w-2.5" aria-hidden="true" />
      }
      {isSignedIn ? "Signed in" : "Device mode"}
    </span>
  )
}
