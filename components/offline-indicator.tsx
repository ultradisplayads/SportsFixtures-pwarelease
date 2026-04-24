"use client"

import { WifiOff, Wifi } from "lucide-react"
import { useEffect, useState } from "react"

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      setShowBanner(true)
      // Hide banner after 3 seconds
      setTimeout(() => setShowBanner(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowBanner(true)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (!showBanner) return null

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 mx-auto max-w-md animate-in slide-in-from-top duration-300 ${
        isOnline ? "bg-green-500" : "bg-red-500"
      }`}
    >
      <div className="flex items-center justify-center gap-2 px-4 py-2 text-white">
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span className="text-sm font-medium">Back Online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">No Internet Connection</span>
          </>
        )}
      </div>
    </div>
  )
}
