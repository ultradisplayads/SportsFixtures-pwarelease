"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, Settings, RefreshCw, Calendar, Trophy, DollarSign, Bell } from "lucide-react"
import { useRouter } from "next/navigation"
import { triggerHaptic } from "@/lib/haptic-feedback"

export function AdminPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "A") {
        e.preventDefault()
        setIsOpen((prev) => !prev)
        triggerHaptic("light")
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const resetOnboarding = () => {
    localStorage.removeItem("onboarding_completed")
    localStorage.removeItem("followed_teams")
    triggerHaptic("success")
    alert("Onboarding reset! Refresh to see welcome screen.")
  }

  const resetGamification = () => {
    localStorage.removeItem("user_gamification")
    localStorage.removeItem("user_predictions")
    localStorage.removeItem("user_points")
    triggerHaptic("success")
    alert("Gamification data reset!")
    window.location.reload()
  }

  const resetSubscription = () => {
    localStorage.removeItem("sf_subscription_v2")
    triggerHaptic("success")
    alert("Subscription reset to Bronze!")
    window.location.reload()
  }

  const setSubscription = (tier: "bronze" | "silver" | "gold") => {
    const sub = { tier, active: true, launchPassActive: false, features: {}, expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() }
    localStorage.setItem("sf_subscription_v2", JSON.stringify(sub))
    triggerHaptic("success")
    alert(`Subscription set to ${tier.charAt(0).toUpperCase() + tier.slice(1)}!`)
    window.location.reload()
  }

  const quickNav = (path: string) => {
    triggerHaptic("light")
    router.push(path)
    setIsOpen(false)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => { setIsOpen(true); triggerHaptic("light") }}
        className="fixed bottom-20 right-4 z-[9999] w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="Open Admin Panel"
      >
        <Settings className="w-5 h-5" />
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Admin Panel</h2>
            <p className="text-sm text-muted-foreground">Dev tools &amp; quick navigation</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => { setIsOpen(false); triggerHaptic("light") }}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><Calendar className="w-5 h-5" />Quick Navigation</h3>
          <div className="grid grid-cols-2 gap-2">
            {["/","onboarding","/live","/fixtures","/results","/favourites","/social","/venues","/local-leagues/pool","/local-leagues/darts","/news","/search"].map((p) => (
              <Button key={p} variant="outline" onClick={() => quickNav(p)}>
                {p === "/" ? "Home" : p.split("/").filter(Boolean).map(s => s.charAt(0).toUpperCase()+s.slice(1)).join(" ")}
              </Button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><Bell className="w-5 h-5" />Push Notifications</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => quickNav("/admin/push")} className="col-span-2">Open Push Dashboard</Button>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><DollarSign className="w-5 h-5" />Pricing Pages</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => quickNav("/premium")}>Consumer Pricing</Button>
            <Button variant="outline" onClick={() => quickNav("/venues/pricing")}>Venue Pricing</Button>
            <Button variant="outline" onClick={() => quickNav("/local-leagues/pricing")}>League Pricing</Button>
            <Button variant="outline" onClick={() => quickNav("/venues/owner-signup")}>Venue Signup</Button>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><RefreshCw className="w-5 h-5" />Reset State</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="destructive" onClick={resetOnboarding}>Reset Onboarding</Button>
            <Button variant="destructive" onClick={resetGamification}>Reset Gamification</Button>
            <Button variant="destructive" onClick={resetSubscription}>Reset Subscription</Button>
            <Button variant="destructive" onClick={() => { localStorage.clear(); triggerHaptic("success"); alert("All data cleared!"); window.location.reload() }}>
              Clear All Data
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><Trophy className="w-5 h-5" />Set Subscription Tier</h3>
          <div className="grid grid-cols-3 gap-2">
            <Button onClick={() => setSubscription("bronze")}>Bronze</Button>
            <Button onClick={() => setSubscription("silver")}>Silver</Button>
            <Button onClick={() => setSubscription("gold")}>Gold</Button>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">System Info</h3>
          <div className="text-xs space-y-1 text-muted-foreground">
            <p>Current Tier: {typeof window !== "undefined" ? JSON.parse(localStorage.getItem("sf_subscription_v2") || "{}").tier || "bronze" : "bronze"}</p>
            <p>Onboarding: {typeof window !== "undefined" ? (localStorage.getItem("onboarding_completed") ? "Completed" : "Not Started") : "Unknown"}</p>
            <p className="pt-2 border-t mt-2">Keyboard Shortcut: Ctrl/Cmd + Shift + A</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
