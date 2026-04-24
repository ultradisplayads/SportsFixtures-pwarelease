"use client"

// Auth Context — the single source of truth for user identity in the PWA.
//
// Provider: AuthProvider (wrap in layout.tsx)
// Consumer: useAuth() hook anywhere in the tree
//
// CURRENT STATE (pre-dev auth sprint):
//   - Anonymous mode: device_token only (already working)
//   - Stub hooks for all auth methods your dev will implement
//
// WHEN DEV DELIVERS AUTH:
//   1. Implement the four login functions below
//   2. Set AUTH_ENABLED=true in env vars
//   3. Remove the "TODO" comments
//   4. The rest of the PWA (favourites, push, onboarding) reads from useAuth()
//      and will automatically upgrade from device-token to user-id mode

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

// ─── Types ───────────────────────────────────────────────────────────────────

export type AuthProvider = "email" | "zoho_otp" | "google" | "facebook" | "apple"

export interface AuthUser {
  id: string                  // Strapi user id
  email: string
  username?: string
  firstName?: string
  lastName?: string
  avatar?: string
  provider: AuthProvider
  jwt: string                 // Strapi JWT — use in Authorization: Bearer header
  deviceToken: string         // Always set — links pre-login activity to account
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  error: string | null
}

interface AuthContextType extends AuthState {
  // Identity (always available, even anonymous)
  deviceToken: string

  // Auth actions — implement these when dev delivers
  signInWithEmail: (email: string, password: string) => Promise<boolean>
  signInWithZohoOTP: (email: string, otp: string) => Promise<boolean>
  requestZohoOTP: (email: string) => Promise<boolean>
  signInWithGoogle: () => Promise<boolean>
  signInWithFacebook: () => Promise<boolean>
  signInWithApple: () => Promise<boolean>
  signOut: () => Promise<void>
  register: (email: string, password: string, username?: string) => Promise<boolean>

  // Derived
  isAuthenticated: boolean
  isAnonymous: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getOrCreateDeviceToken(): string {
  if (typeof window === "undefined") return ""
  let t = localStorage.getItem("sf_device_token")
  if (!t) {
    t = crypto.randomUUID()
    localStorage.setItem("sf_device_token", t)
  }
  return t
}

function persistUser(user: AuthUser) {
  localStorage.setItem("sf_auth_user", JSON.stringify(user))
}

function clearPersistedUser() {
  localStorage.removeItem("sf_auth_user")
}

function loadPersistedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem("sf_auth_user")
    if (!raw) return null
    const user = JSON.parse(raw) as AuthUser
    // Basic expiry check: Strapi JWTs are 30 days — decode exp
    const parts = user.jwt.split(".")
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")))
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        clearPersistedUser()
        return null
      }
    }
    return user
  } catch { return null }
}

// ─── Context ─────────────────────────────────────────────────────────────────

const Ctx = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, error: null })
  const [deviceToken] = useState(getOrCreateDeviceToken)

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const persisted = loadPersistedUser()
    setState({ user: persisted, loading: false, error: null })
  }, [])

  // After login: migrate device-token favourites to user account
  const migrateAnonymousData = useCallback(async (user: AuthUser) => {
    try {
      await fetch("/api/auth/migrate-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_token: deviceToken, user_id: user.id, jwt: user.jwt }),
      })
    } catch { /* non-critical — favourites already visible via device_token */ }
  }, [deviceToken])

  const setUser = useCallback((user: AuthUser | null) => {
    setState({ user, loading: false, error: null })
    if (user) {
      persistUser(user)
      migrateAnonymousData(user)
      // Update push subscription with user_id
      navigator.serviceWorker?.ready.then(reg =>
        reg.pushManager.getSubscription().then(sub => {
          if (sub) {
            fetch("/api/push/subscribe", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ endpoint: sub.toJSON().endpoint, userId: user.id }),
            }).catch(() => {})
          }
        })
      )
    } else {
      clearPersistedUser()
    }
  }, [migrateAnonymousData])

  // ─── Email + Password ─────────────────────────────────────────────────────
  const signInWithEmail = useCallback(async (email: string, password: string): Promise<boolean> => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SF_API_URL || "https://staging-api.sportsfixtures.net"}/api/auth/local`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setState(s => ({ ...s, loading: false, error: data.error?.message || "Login failed" }))
        return false
      }
      setUser({
        id: String(data.user.id),
        email: data.user.email,
        username: data.user.username,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        provider: "email",
        jwt: data.jwt,
        deviceToken,
      })
      return true
    } catch (e: any) {
      setState(s => ({ ...s, loading: false, error: e.message }))
      return false
    }
  }, [deviceToken, setUser])

  // ─── Register ─────────────────────────────────────────────────────────────
  const register = useCallback(async (email: string, password: string, username?: string): Promise<boolean> => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SF_API_URL || "https://staging-api.sportsfixtures.net"}/api/auth/local/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username: username || email.split("@")[0] }),
      })
      const data = await res.json()
      if (!res.ok) {
        setState(s => ({ ...s, loading: false, error: data.error?.message || "Registration failed" }))
        return false
      }
      setUser({
        id: String(data.user.id),
        email: data.user.email,
        username: data.user.username,
        provider: "email",
        jwt: data.jwt,
        deviceToken,
      })
      return true
    } catch (e: any) {
      setState(s => ({ ...s, loading: false, error: e.message }))
      return false
    }
  }, [deviceToken, setUser])

  // ─── Zoho OTP ─────────────────────────────────────────────────────────────
  // Step 1: requestZohoOTP(email) → Strapi sends OTP via Zoho Mail
  // Step 2: signInWithZohoOTP(email, otp) → validates OTP, returns JWT
  const requestZohoOTP = useCallback(async (email: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/zoho-otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      return res.ok
    } catch { return false }
  }, [])

  const signInWithZohoOTP = useCallback(async (email: string, otp: string): Promise<boolean> => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const res = await fetch("/api/auth/zoho-otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, device_token: deviceToken }),
      })
      const data = await res.json()
      if (!res.ok) {
        setState(s => ({ ...s, loading: false, error: data.error || "Invalid OTP" }))
        return false
      }
      setUser({ ...data.user, provider: "zoho_otp", jwt: data.jwt, deviceToken })
      return true
    } catch (e: any) {
      setState(s => ({ ...s, loading: false, error: e.message }))
      return false
    }
  }, [deviceToken, setUser])

  // ─── Social providers ─────────────────────────────────────────────────────
  // Strapi supports these natively. Flow: redirect → callback → JWT
  const signInWithGoogle = useCallback(async (): Promise<boolean> => {
    const apiBase = process.env.NEXT_PUBLIC_SF_API_URL || "https://staging-api.sportsfixtures.net"
    window.location.href = `${apiBase}/api/connect/google?device_token=${deviceToken}`
    return true
  }, [deviceToken])

  const signInWithFacebook = useCallback(async (): Promise<boolean> => {
    const apiBase = process.env.NEXT_PUBLIC_SF_API_URL || "https://staging-api.sportsfixtures.net"
    window.location.href = `${apiBase}/api/connect/facebook?device_token=${deviceToken}`
    return true
  }, [deviceToken])

  const signInWithApple = useCallback(async (): Promise<boolean> => {
    const apiBase = process.env.NEXT_PUBLIC_SF_API_URL || "https://staging-api.sportsfixtures.net"
    window.location.href = `${apiBase}/api/connect/apple?device_token=${deviceToken}`
    return true
  }, [deviceToken])

  // ─── Sign out ─────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    setUser(null)
  }, [setUser])

  return (
    <Ctx.Provider value={{
      ...state,
      deviceToken,
      isAuthenticated: !!state.user,
      isAnonymous: !state.user,
      signInWithEmail,
      signInWithZohoOTP,
      requestZohoOTP,
      signInWithGoogle,
      signInWithFacebook,
      signInWithApple,
      signOut,
      register,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
