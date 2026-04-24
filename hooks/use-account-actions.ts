"use client"

// hooks/use-account-actions.ts
// Provides typed action functions for profile edits, password changes, consent saves,
// and account deletion. Each function returns { success, error } — never fakes success.
// Components call these and get back explicit pass/fail feedback to show to the user.

import { useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import type {
  ProfileEditPayload,
  PasswordChangePayload,
  ConsentUpdatePayload,
  UserProfileSummary,
  ConsentKey,
} from "@/types/account"

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

export function useAccountActions() {
  const { user, deviceToken } = useAuth()

  function authHeaders(): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" }
    if (user?.jwt) h["Authorization"] = `Bearer ${user.jwt}`
    if (deviceToken) h["x-device-token"] = deviceToken
    return h
  }

  // ── Update profile ────────────────────────────────────────────────────────
  const updateProfile = useCallback(
    async (payload: ProfileEditPayload): Promise<ActionResult<UserProfileSummary>> => {
      try {
        const res = await fetch("/api/account/profile", {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (!res.ok) return { success: false, error: json.error || "Failed to save profile" }
        return { success: true, data: json.profile }
      } catch (err: any) {
        return { success: false, error: err?.message || "Failed to save profile" }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.jwt, deviceToken],
  )

  // ── Change password ───────────────────────────────────────────────────────
  const changePassword = useCallback(
    async (payload: PasswordChangePayload): Promise<ActionResult> => {
      try {
        const res = await fetch("/api/account/password", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (!res.ok) return { success: false, error: json.error || "Failed to change password" }
        return { success: true, data: undefined }
      } catch (err: any) {
        return { success: false, error: err?.message || "Failed to change password" }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.jwt, deviceToken],
  )

  // ── Save consent ──────────────────────────────────────────────────────────
  const saveConsent = useCallback(
    async (
      values: Record<ConsentKey, boolean>,
    ): Promise<ActionResult<{ values: Record<ConsentKey, boolean>; localOnly?: boolean }>> => {
      try {
        const payload: ConsentUpdatePayload = { values }
        const res = await fetch("/api/account/consent", {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (!res.ok) return { success: false, error: json.error || "Failed to save privacy settings" }

        // If anonymous, also persist to localStorage so the page reads back correct state
        if (json.localOnly && typeof window !== "undefined") {
          localStorage.setItem("sf_consent", JSON.stringify(values))
        }

        return { success: true, data: { values: json.values, localOnly: json.localOnly } }
      } catch (err: any) {
        return { success: false, error: err?.message || "Failed to save privacy settings" }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.jwt, deviceToken],
  )

  // ── Delete account ────────────────────────────────────────────────────────
  // This delegates to the existing /api/account/delete endpoint that already exists
  // and performs full Neon DB cleanup. The component does client-side teardown after.
  const deleteAccount = useCallback(async (): Promise<ActionResult> => {
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ deviceToken }),
      })
      const json = await res.json()
      if (!json.success) return { success: false, error: json.error || "Failed to delete account" }
      return { success: true, data: undefined }
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to delete account" }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.jwt, deviceToken])

  return { updateProfile, changePassword, saveConsent, deleteAccount }
}
