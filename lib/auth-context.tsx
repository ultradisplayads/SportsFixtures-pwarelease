"use client"

// Auth Context — secure session management.
//
// Security model:
//   JWT         → httpOnly cookie "sf_auth" (never readable by JS)
//   Expiry time → localStorage only (non-sensitive, used for idle tracking)
//   User data   → localStorage (non-sensitive UI data: name, email, role)
//
// Session expiry (client requirement):
//   Normal user / venue owner : 24 hours
//   Admin / internal          : 2 hours
//
// On mount  : check localStorage expiry first (instant) → validate with server
// On login  : set expiry in localStorage, cookie set server-side
// On expiry : clear localStorage, server clears cookie, redirect to /sign-in
// On refresh: cookie still valid → session persists ✅

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"

export type AuthProviderType = "email" | "zoho_otp" | "google" | "facebook" | "apple"

export interface AuthUser {
  id: string
  email: string
  username?: string
  firstName?: string
  lastName?: string
  avatar?: string
  provider: AuthProviderType
  role?: { type: string; name: string }
  deviceToken: string
  // NOTE: No jwt field — JWT lives in httpOnly cookie only
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  error: string | null
}

interface AuthContextType extends AuthState {
  deviceToken: string
  signInWithEmail: (email: string, password: string) => Promise<boolean>
  signInWithZohoOTP: (email: string, otp: string) => Promise<boolean>
  requestZohoOTP: (email: string) => Promise<boolean>
  signInWithGoogle: () => Promise<boolean>
  signInWithFacebook: () => Promise<boolean>
  signInWithApple: () => Promise<boolean>
  signOut: () => Promise<void>
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<boolean>
  isAuthenticated: boolean
  isAnonymous: boolean
}

// ─── Role-based session durations (client requirement) ────────────────────────

const SESSION_DURATIONS: Record<string, number> = {
  authenticated: 24 * 60 * 60 * 1000,
  venue_owner:   24 * 60 * 60 * 1000,
  admin:          2 * 60 * 60 * 1000,
  internal:       2 * 60 * 60 * 1000,
}

const DEFAULT_DURATION = 24 * 60 * 60 * 1000

function getSessionDuration(roleType?: string): number {
  if (!roleType) return DEFAULT_DURATION
  return SESSION_DURATIONS[roleType] ?? DEFAULT_DURATION
}

// ─── localStorage keys ────────────────────────────────────────────────────────

const USER_KEY   = "sf_auth_user"
const EXPIRY_KEY = "sf_auth_expiry"
const DEVICE_KEY = "sf_device_token"

// ─── helpers ──────────────────────────────────────────────────────────────────

function getOrCreateDeviceToken(): string {
  if (typeof window === "undefined") return ""
  let t = localStorage.getItem(DEVICE_KEY)
  if (!t) { t = crypto.randomUUID(); localStorage.setItem(DEVICE_KEY, t) }
  return t
}

function persistSession(user: AuthUser, roleType?: string): void {
  const duration = getSessionDuration(roleType)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  localStorage.setItem(EXPIRY_KEY, String(Date.now() + duration))
}

function clearSession(): void {
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(EXPIRY_KEY)
}

function isSessionExpired(): boolean {
  const expiry = localStorage.getItem(EXPIRY_KEY)
  if (!expiry) return true
  return Date.now() > Number(expiry)
}

function loadCachedUser(): AuthUser | null {
  try {
    if (isSessionExpired()) { clearSession(); return null }
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch { return null }
}

export function getRoleRedirect(roleType?: string): string {
  switch (roleType) {
    case "venue_owner": return "/venue-owners"
    case "admin":
    case "internal": return "/admin"
    default: return "/"
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const Ctx = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, error: null })
  const [deviceToken] = useState(getOrCreateDeviceToken)

  // Mount: check localStorage expiry instantly, then validate cookie with server
  useEffect(() => {
    const restore = async () => {
      const cached = loadCachedUser()

      if (!cached) {
        setState({ user: null, loading: false, error: null })
        return
      }

      // Restore instantly — user sees logged-in UI without waiting for network
      setState({ user: cached, loading: false, error: null })

      // Background: validate httpOnly cookie is still valid on server
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" })
        const data = await res.json()
        if (!data.authenticated) {
          clearSession()
          setState({ user: null, loading: false, error: null })
          window.location.href = "/sign-in?reason=session_expired"
        }
      } catch {
        // Network error — keep session alive, cookie still valid
      }
    }

    restore()
  }, [])

  const migrateAnonymousData = useCallback(async (userId: string) => {
    try {
      await fetch("/api/auth/migrate-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_token: deviceToken, user_id: userId }),
      })
    } catch {}
  }, [deviceToken])

  const linkPushToUser = useCallback((userId: string) => {
    if (typeof navigator === "undefined") return
    navigator.serviceWorker?.ready
      .then(r => r.pushManager.getSubscription())
      .then(sub => {
        if (!sub) return
        fetch("/api/push/subscribe", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.toJSON().endpoint, userId }),
        }).catch(() => {})
      }).catch(() => {})
  }, [])

  const setUser = useCallback((user: AuthUser | null, roleType?: string) => {
    setState({ user, loading: false, error: null })
    if (user) {
      persistSession(user, roleType)
      migrateAnonymousData(user.id)
      linkPushToUser(user.id)
    } else {
      clearSession()
    }
  }, [migrateAnonymousData, linkPushToUser])

  const signInWithEmail = useCallback(async (email: string, password: string): Promise<boolean> => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setState(s => ({ ...s, loading: false, error: data.error || "Sign in failed" }))
        return false
      }
      const roleType = data.user?.role?.type
      setUser({ id: String(data.user.id), email: data.user.email, username: data.user.username, firstName: data.user.firstName, lastName: data.user.lastName, provider: "email", role: data.user.role, deviceToken }, roleType)
      return true
    } catch (e: any) {
      setState(s => ({ ...s, loading: false, error: e.message }))
      return false
    }
  }, [deviceToken, setUser])

  const register = useCallback(async (email: string, password: string, username?: string,  firstName?: string, lastName?: string): Promise<boolean> => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          username: firstName || email.split("@")[0],
          firstName: firstName || email.split("@")[0],
          lastName: lastName || firstName || email.split("@")[0], // ← never empty
        }),
            })
      const data = await res.json()
      if (!res.ok) {
        setState(s => ({ ...s, loading: false, error: data.error || "Registration failed" }))
        return false
      }
      setState(s => ({ ...s, loading: false }))
      return true
    } catch (e: any) {
      setState(s => ({ ...s, loading: false, error: e.message }))
      return false
    }
  }, [])

  const requestZohoOTP = useCallback(async (email: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/resend-otp", {
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
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, otp }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setState(s => ({ ...s, loading: false, error: data.error || "Invalid OTP" }))
        return false
      }
      const roleType = data.user?.role?.type
      setUser({ id: String(data.user.id), email: data.user.email, username: data.user.username, firstName: data.user.firstName, lastName: data.user.lastName, provider: "zoho_otp", role: data.user.role, deviceToken }, roleType)
      return true
    } catch (e: any) {
      setState(s => ({ ...s, loading: false, error: e.message }))
      return false
    }
  }, [deviceToken, setUser])

// ✅ Replace signInWithGoogle
const signInWithGoogle = useCallback(async (): Promise<boolean> => {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
  window.location.href = `${process.env.NEXT_PUBLIC_SF_API_URL}/api/oauth/init?provider=google&origin=${encodeURIComponent(origin)}`
  return true
}, [])

// ✅ Replace signInWithFacebook
const signInWithFacebook = useCallback(async (): Promise<boolean> => {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
  window.location.href = `${process.env.NEXT_PUBLIC_SF_API_URL}/api/oauth/init?provider=facebook&origin=${encodeURIComponent(origin)}`
  return true
}, [])

  const signInWithApple = useCallback(async (): Promise<boolean> => {
    window.location.href = `${process.env.NEXT_PUBLIC_SF_API_URL}/api/connect/apple`
    return true
  }, [])

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    } catch {}
    clearSession()
    setState({ user: null, loading: false, error: null })
    window.location.href = "/auth/signin"
  }, [])

  // Cross-tab sync — logout in one tab logs out all tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === USER_KEY && e.newValue === null) {
        setState({ user: null, loading: false, error: null })
        window.location.href = "/sign-in"
      }
      if (e.key === USER_KEY && e.newValue) {
        try { setState({ user: JSON.parse(e.newValue), loading: false, error: null }) } catch {}
      }
    }
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  return (
    <Ctx.Provider value={{
      ...state, deviceToken,
      isAuthenticated: !!state.user,
      isAnonymous: !state.user,
      signInWithEmail, signInWithZohoOTP, requestZohoOTP,
      signInWithGoogle, signInWithFacebook, signInWithApple,
      signOut, register,
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