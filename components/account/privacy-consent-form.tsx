"use client"

// components/account/privacy-consent-form.tsx
// Serious, real privacy controls — not decorative.
// Toggles save real state via useAccountActions().saveConsent().
// Anonymous users get device-local storage; signed-in users get server persistence.

import { useState } from "react"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { CONSENT_KEYS, consentLabel, consentDescription } from "@/lib/account"
import { useAccountActions } from "@/hooks/use-account-actions"
import type { UserConsentState, ConsentKey } from "@/types/account"

interface PrivacyConsentFormProps {
  initial: UserConsentState
  isAnonymous?: boolean
}

export function PrivacyConsentForm({ initial, isAnonymous }: PrivacyConsentFormProps) {
  const { saveConsent } = useAccountActions()
  const [values, setValues] = useState<Record<ConsentKey, boolean>>(initial.values)
  const [saving, setSaving] = useState<ConsentKey | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<string | null>(
    initial.updatedAt
      ? `Last updated ${new Date(initial.updatedAt).toLocaleDateString("en-GB")}`
      : null,
  )

  async function toggle(key: ConsentKey) {
    const next = { ...values, [key]: !values[key] }
    setValues(next)
    setSaving(key)
    setError(null)

    const result = await saveConsent(next)
    setSaving(null)

    if (!result.success) {
      // Roll back optimistic update
      setValues(values)
      setError(result.error)
    } else {
      setLastSaved("Saved just now")
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Privacy and consent</p>
          {isAnonymous && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Stored on this device only (no signed-in account).
            </p>
          )}
        </div>
        {lastSaved && (
          <span className="shrink-0 text-xs text-muted-foreground/70">{lastSaved}</span>
        )}
      </div>

      <div className="space-y-3">
        {CONSENT_KEYS.map(key => (
          <div key={key} className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{consentLabel(key)}</p>
              <p className="text-xs text-muted-foreground leading-snug">{consentDescription(key)}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={values[key]}
              disabled={saving !== null}
              onClick={() => toggle(key)}
              className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full border-2 transition-colors ${
                values[key]
                  ? "border-primary bg-primary"
                  : "border-border bg-muted"
              } disabled:opacity-50`}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                values[key] ? "translate-x-5" : "translate-x-0.5"
              }`} />
              {saving === key && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-3 w-3 animate-spin text-white" />
                </span>
              )}
            </button>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
