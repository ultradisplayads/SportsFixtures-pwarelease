// components/account/account-shell.tsx
// Section 06 — Page-level layout wrapper for all account/profile surfaces.
// Provides consistent padding, max-width, and bottom-nav clearance.
// Never includes any data-fetching or auth logic — pure layout.

import type { ReactNode } from "react"

interface AccountShellProps {
  children: ReactNode
  /** Optional page title — renders above children if provided. */
  title?: string
  /** Optional page subtitle / description */
  subtitle?: string
}

export function AccountShell({ children, title, subtitle }: AccountShellProps) {
  return (
    <main className="flex min-h-screen flex-col bg-background pb-24">
      {(title || subtitle) && (
        <header className="border-b border-border bg-card px-4 py-4">
          {title && (
            <h1 className="text-lg font-bold leading-tight text-foreground">{title}</h1>
          )}
          {subtitle && (
            <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </header>
      )}
      <div className="flex-1 space-y-4 p-4">{children}</div>
    </main>
  )
}
