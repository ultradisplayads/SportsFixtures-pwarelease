"use client"

// components/account/delete-account-panel.tsx
// Trust-critical panel — deliberate, confirmable, not a single accidental tap.
// Requires the user to type "DELETE" exactly before the action is enabled.
// Delegates to the existing /api/account/delete route then clears client state.

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Loader2 } from "lucide-react"
import { useAccountActions } from "@/hooks/use-account-actions"
import { triggerHaptic } from "@/lib/haptic-feedback"

interface DeleteAccountPanelProps {
  enabled: boolean
  warningCopy: string
}

const CONFIRM_PHRASE = "DELETE"

export function DeleteAccountPanel({ enabled, warningCopy }: DeleteAccountPanelProps) {
  const router = useRouter()
  const { deleteAccount } = useAccountActions()
  const [confirmValue, setConfirmValue] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ready = confirmValue === CONFIRM_PHRASE

  if (!enabled) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-semibold">Delete account</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Account deletion is not available in your current mode.
          Sign in to manage your account.
        </p>
      </div>
    )
  }

  async function handleDelete() {
    if (!ready || isDeleting) return
    triggerHaptic("heavy")
    setIsDeleting(true)
    setError(null)

    const result = await deleteAccount()

    if (!result.success) {
      setIsDeleting(false)
      setError(result.error)
      return
    }

    // Client-side teardown after server confirms deletion
    try {
      localStorage.clear()
      sessionStorage.clear()
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map(r => r.unregister()))
      }
      if ("caches" in window) {
        const keys = await caches.keys()
        await Promise.all(keys.map(k => caches.delete(k)))
      }
    } catch {
      // Non-fatal — server data already deleted
    }

    router.replace("/onboarding")
  }

  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <div>
          <p className="text-sm font-semibold text-destructive">Delete account</p>
          <p className="mt-1 text-sm text-muted-foreground">{warningCopy}</p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Type{" "}
          <span className="font-mono font-bold text-destructive">{CONFIRM_PHRASE}</span>{" "}
          to confirm
        </label>
        <input
          type="text"
          value={confirmValue}
          onChange={e => {
            setConfirmValue(e.target.value)
            setError(null)
          }}
          placeholder={CONFIRM_PHRASE}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-destructive"
        />
      </div>

      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={!ready || isDeleting}
        onClick={handleDelete}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-3 text-sm font-bold text-destructive-foreground disabled:opacity-50"
      >
        {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
        {isDeleting ? "Deleting..." : "Permanently delete account"}
      </button>
    </div>
  )
}
