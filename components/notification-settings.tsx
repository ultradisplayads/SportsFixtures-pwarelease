"use client"

import { Bell, BellOff, Loader2 } from "lucide-react"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { useNotifications, type PushPreferences } from "@/components/notification-provider"

const TOGGLE_ITEMS: { key: keyof PushPreferences; label: string; description: string }[] = [
  { key: "matchStart",  label: "Match Start",     description: "Alert when a followed match kicks off" },
  { key: "goals",       label: "Goals",            description: "Instant alert for every goal" },
  { key: "halftime",    label: "Half Time",        description: "Score update at the interval" },
  { key: "fulltime",    label: "Full Time",        description: "Final score notification" },
  { key: "cards",       label: "Cards",            description: "Yellow and red card alerts" },
  { key: "lineups",     label: "Lineups",          description: "Confirmed team lineups" },
  { key: "venueOffers", label: "Venue Offers",     description: "Nearby bar and venue promotions" },
  { key: "advertising", label: "Sponsor Alerts",   description: "Offers from our advertising partners" },
]

export function NotificationSettings({
  teamId,
  teamName,
}: {
  teamId?: string
  teamName?: string
}) {
  const { permission, isSubscribed, isRegistering, preferences, requestPermission, unsubscribe, updatePreferences } =
    useNotifications()

  const handleToggleSubscription = async () => {
    triggerHaptic("medium")
    if (isSubscribed) {
      await unsubscribe()
    } else {
      await requestPermission()
    }
  }

  const handleTogglePref = async (key: keyof PushPreferences) => {
    triggerHaptic("light")
    await updatePreferences({ [key]: !preferences[key] })
  }

  const isBlocked = permission === "denied"

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{teamName ? `${teamName} Notifications` : "Push Notifications"}</h3>
          <p className="text-xs text-muted-foreground">
            {isBlocked
              ? "Notifications blocked — allow in browser settings"
              : isSubscribed
              ? "You are subscribed to push notifications"
              : "Subscribe to get live match alerts on this device"}
          </p>
        </div>
        <button
          onClick={handleToggleSubscription}
          disabled={isRegistering || isBlocked}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
            isSubscribed
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-primary/10"
          }`}
        >
          {isRegistering ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isSubscribed ? (
            <Bell className="h-4 w-4" />
          ) : (
            <BellOff className="h-4 w-4" />
          )}
          {isSubscribed ? "On" : "Off"}
        </button>
      </div>

      {/* Preference toggles — only shown when subscribed */}
      {isSubscribed && (
        <div className="space-y-2">
          {TOGGLE_ITEMS.map(({ key, label, description }) => (
            <button
              key={key}
              onClick={() => handleTogglePref(key)}
              className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-accent"
            >
              <div className="flex-1">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <div
                className={`relative ml-3 h-6 w-11 shrink-0 rounded-full transition-colors ${
                  preferences[key] ? "bg-primary" : "bg-muted"
                }`}
              >
                <div
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    preferences[key] ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Blocked state helper */}
      {isBlocked && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          Notifications are blocked. Open your browser settings and allow notifications for this site to re-enable.
        </div>
      )}
    </div>
  )
}
