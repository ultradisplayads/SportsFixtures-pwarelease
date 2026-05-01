"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function GoogleCallbackPage() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get("access_token") || searchParams.get("id_token")
    const error = searchParams.get("error")

    if (error || !token) {
      window.location.href = "/auth?error=google_auth_failed"
      return
    }

    // ✅ Relay logic is INSIDE useEffect — token is available here
    // Check if login was initiated from PWA
    const originCookie = document.cookie
      .split("; ")
      .find((c) => c.startsWith("sf_oauth_origin="))
      ?.split("=")[1]

    // Clear cookie immediately
    document.cookie = "sf_oauth_origin=; path=/; domain=.sportsfixtures.net; max-age=0"

    if (originCookie && originCookie !== window.location.origin) {
      // Forward token to the originating app (e.g. PWA)
      window.location.href = `${originCookie}/auth/google/callback?access_token=${encodeURIComponent(token)}`
      return
    }

    // Normal flow — this is the correct app
    const completeAuth = async () => {
      try {
        const res = await fetch(
          `/api/auth/google/callback?access_token=${encodeURIComponent(token)}`,
          { credentials: "include" }
        )

        const data = await res.json()

        if (!res.ok || !data.success) {
          console.error("[Google Callback] API error:", data)
          window.location.href = "/auth?error=google_auth_failed"
          return
        }

        const user = data.user
        const roleType = user?.role?.type || "authenticated"

        // Role-based session duration (matches auth-context)
        const duration = ["admin", "internal"].includes(roleType)
          ? 2 * 60 * 60 * 1000   // 2 hours
          : 24 * 60 * 60 * 1000  // 24 hours

        // Write non-sensitive user data to localStorage
        // so auth-context restores instantly on next mount
        localStorage.setItem("sf_auth_user", JSON.stringify({
          id: String(user.id),
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          provider: "google",
          role: user.role,
          deviceToken: localStorage.getItem("sf_device_token") || "",
        }))
        localStorage.setItem("sf_auth_expiry", String(Date.now() + duration))

        // Notify all components that auth state changed
        window.dispatchEvent(new Event("authStateChanged"))

        const redirectMap: Record<string, string> = {
          venue_owner: "/venue-owners",
          admin:       "/admin",
          internal:    "/admin",
        }
        window.location.href = redirectMap[roleType] || "/profile"
      } catch (err) {
        console.error("[Google Callback] Unexpected error:", err)
        window.location.href = "/auth?error=google_auth_failed"
      }
    }

    completeAuth()
  }, [searchParams])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Completing sign-in with Google...</p>
      </div>
    </div>
  )
}