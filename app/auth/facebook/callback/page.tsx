"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function FacebookCallbackPage() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get("access_token")
    const error = searchParams.get("error")

    if (error || !token) {
      window.location.href = "/auth/signin?error=facebook_auth_failed"
      return
    }

    const completeAuth = async () => {
      try {
        // Call API route — sets httpOnly cookie on 200 JSON response
        const res = await fetch(
          `/api/auth/facebook/callback?access_token=${encodeURIComponent(token)}`,
          { credentials: "include" }
        )

        const data = await res.json()

        if (!res.ok || !data.success) {
          console.error("[Facebook Callback] API error:", data)
          window.location.href = "/auth/signin?error=facebook_auth_failed"
          return
        }

        const user = data.user
        const roleType = user?.role?.type || "authenticated"

        // Role-based session duration — matches auth-context
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
          provider: "facebook",
          role: user.role,
          deviceToken: localStorage.getItem("sf_device_token") || "",
        }))
        localStorage.setItem("sf_auth_expiry", String(Date.now() + duration))

        // Notify all components auth state changed
        window.dispatchEvent(new Event("authStateChanged"))

        // Redirect based on role
        const redirectMap: Record<string, string> = {
          venue_owner: "/venue-owners",
          admin:       "/admin",
          internal:    "/admin",
        }
        window.location.href = redirectMap[roleType] || "/"
      } catch (err) {
        console.error("[Facebook Callback] Unexpected error:", err)
        window.location.href = "/auth/signin?error=facebook_auth_failed"
      }
    }

    completeAuth()
  }, [searchParams])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="mt-4 text-sm text-muted-foreground">
        Completing sign-in with Facebook...
      </p>
    </div>
  )
}