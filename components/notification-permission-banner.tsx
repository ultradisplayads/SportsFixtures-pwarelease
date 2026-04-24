"use client"

import { useState, useEffect } from "react"
import { Bell, X } from "lucide-react"
import { useNotifications } from "./notification-provider"

export function NotificationPermissionBanner() {
  const { permission, requestPermission } = useNotifications()
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Show banner if permission is default (not asked yet) and user hasn't dismissed it
    const dismissed = localStorage.getItem("notificationBannerDismissed")
    if (permission === "default" && !dismissed) {
      setShowBanner(true)
    }
  }, [permission])

  const handleEnable = async () => {
    await requestPermission()
    setShowBanner(false)
  }

  const handleDismiss = () => {
    localStorage.setItem("notificationBannerDismissed", "true")
    setShowBanner(false)
  }

  if (!showBanner || permission !== "default") {
    return null
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md">
      <div className="rounded-lg border border-border bg-card p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Enable Notifications</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get alerts for match starts, goals, and final scores for your favourite teams
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleEnable}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Enable
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Not Now
              </button>
            </div>
          </div>
          <button onClick={handleDismiss} className="shrink-0 rounded-md p-1 hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
