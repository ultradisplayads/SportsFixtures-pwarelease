"use client"

// hooks/use-profile-form.ts
// Section 06 — Controlled form hook for profile editing.
// Encapsulates form state, dirty tracking, and server submission so
// components stay declarative. Uses useAccountActions under the hood.

import { useState, useCallback } from "react"
import { useAccountActions } from "@/hooks/use-account-actions"
import type { UserProfileSummary, ProfileEditPayload } from "@/types/account"

type ProfileFormState = {
  displayName: string
  firstName: string
  lastName: string
  phone: string
  city: string
  country: string
  timezone: string
}

type UseProfileFormResult = {
  form: ProfileFormState
  isDirty: boolean
  saving: boolean
  error: string | null
  success: string | null
  set: (key: keyof ProfileFormState, value: string) => void
  reset: () => void
  submit: () => Promise<void>
}

function profileToForm(profile: UserProfileSummary): ProfileFormState {
  return {
    displayName: profile.displayName ?? "",
    firstName:   profile.firstName  ?? "",
    lastName:    profile.lastName   ?? "",
    phone:       profile.phone      ?? "",
    city:        profile.city       ?? "",
    country:     profile.country    ?? "",
    timezone:    profile.timezone   ?? "",
  }
}

function isDirtyCheck(initial: ProfileFormState, current: ProfileFormState): boolean {
  return (Object.keys(initial) as (keyof ProfileFormState)[]).some(
    (k) => initial[k] !== current[k],
  )
}

export function useProfileForm(
  profile: UserProfileSummary,
  onSaved?: (updated: UserProfileSummary) => void,
): UseProfileFormResult {
  const { updateProfile } = useAccountActions()
  const initial = profileToForm(profile)

  const [form, setForm]       = useState<ProfileFormState>(initial)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const isDirty = isDirtyCheck(initial, form)

  const set = useCallback((key: keyof ProfileFormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setError(null)
    setSuccess(null)
  }, [])

  const reset = useCallback(() => {
    setForm(initial)
    setError(null)
    setSuccess(null)
  }, [initial])

  const submit = useCallback(async () => {
    if (saving) return
    setSaving(true)
    setError(null)
    setSuccess(null)

    const payload: ProfileEditPayload = {
      displayName: form.displayName || undefined,
      firstName:   form.firstName   || undefined,
      lastName:    form.lastName    || undefined,
      phone:       form.phone       || undefined,
      city:        form.city        || undefined,
      country:     form.country     || undefined,
      timezone:    form.timezone    || undefined,
    }

    const result = await updateProfile(payload)
    setSaving(false)

    if (!result.success) {
      setError(result.error)
    } else {
      setSuccess("Profile updated successfully.")
      onSaved?.(result.data)
    }
  }, [form, saving, updateProfile, onSaved])

  return { form, isDirty, saving, error, success, set, reset, submit }
}
