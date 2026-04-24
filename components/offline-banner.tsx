"use client"

import { WifiOff } from "lucide-react"
import { useOnlineStatus } from "@/lib/pwa-manager"

export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="fixed left-0 right-0 top-0 z-50 bg-destructive px-4 py-2 text-center text-sm font-medium text-destructive-foreground">
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span>You're offline. Showing cached content.</span>
      </div>
    </div>
  )
}
