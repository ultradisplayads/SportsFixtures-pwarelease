"use client"

// hooks/use-consent-settings.ts
// Section 06 — Consent toggle hook with optimistic updates and rollback.
// Encapsulates all toggle/save logic so ConsentPanel stays declarative.
// Optimistic update: flips the value immediately, rolls back on server error.

import { useState, useCallback } from "react"
import { useAccountActions } from "@/hooks/use-account-actions"
import type { UserConsentState, ConsentKey } from "@/types/account"

type UseConsentSettingsResult = {
  values: Record<ConsentKey, boolean>
  savingKey: ConsentKey | null
  error: string | null
  lastSavedLabel: string | null
  toggle: (key: ConsentKey) => Promise<void>
  setAll: (next: Record<ConsentKey, boolean>) => Promise<void>
}

export function useConsentSettings(initial: UserConsentState): UseConsentSettingsResult {
  const { saveConsent } = useAccountActions()

  const [values, setValues]           = useState<Record<ConsentKey, boolean>>(initial.values)
  const [savingKey, setSavingKey]     = useState<ConsentKey | null>(null)
  const [error, setError]             = useState<string | null>(null)
  const [lastSavedLabel, setLastSaved] = useState<string | null>(
    initial.updatedAt
      ? `Last updated ${new Date(initial.updatedAt).toLocaleDateString("en-GB")}`
      : null,
  )

  const persist = useCallback(
    async (
      next: Record<ConsentKey, boolean>,
      keyBeingSaved: ConsentKey | null,
      prev: Record<ConsentKey, boolean>,
    ) => {
      setSavingKey(keyBeingSaved)
      setError(null)

      const result = await saveConsent(next)
      setSavingKey(null)

      if (!result.success) {
        // Roll back optimistic update
        setValues(prev)
        setError(result.error)
      } else {
        setLastSaved("Saved just now")
      }
    },
    [saveConsent],
  )

  const toggle = useCallback(
    async (key: ConsentKey) => {
      if (savingKey !== null) return // prevent concurrent saves
      const prev  = values
      const next  = { ...values, [key]: !values[key] }
      setValues(next) // optimistic
      await persist(next, key, prev)
    },
    [values, savingKey, persist],
  )

  const setAll = useCallback(
    async (next: Record<ConsentKey, boolean>) => {
      if (savingKey !== null) return
      const prev = values
      setValues(next)
      await persist(next, null, prev)
    },
    [values, savingKey, persist],
  )

  return { values, savingKey, error, lastSavedLabel, toggle, setAll }
}
