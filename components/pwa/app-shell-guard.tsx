"use client"

// Section 09 — App Shell Guard
// Single mounting point for all PWA platform banners.
// Orchestrates: offline, reconnect, update-available, install-prompt.
//
// Rules:
// - Only one platform banner shows at a time (priority: offline > update > install)
// - Install prompt is never shown when already in standalone mode
// - Reconnect toast auto-dismisses after 3 seconds
// - Banners never overlap critical bottom navigation

import { useCallback, useEffect, useRef, useState } from "react"
import { usePlatformStatus } from "@/hooks/use-platform-status"
import { useInstallPrompt } from "@/hooks/use-install-prompt"
import { useUpdateAvailable } from "@/hooks/use-update-available"
import { OfflineBanner } from "@/components/pwa/offline-banner"
import { ReconnectToast } from "@/components/pwa/reconnect-toast"
import { UpdateAvailableBanner } from "@/components/pwa/update-available-banner"
import { InstallBanner } from "@/components/pwa/install-banner"

interface AppShellGuardProps {
  children: React.ReactNode
}

export function AppShellGuard({ children }: AppShellGuardProps) {
  const { status } = usePlatformStatus()
  const { installState, promptInstall, dismissInstall } = useInstallPrompt()
  const { updateState, activateUpdate } = useUpdateAvailable()

  // Reconnect toast: fires once when transitioning offline → online
  const [showReconnect, setShowReconnect] = useState(false)
  const prevNetworkRef = useRef(status.network)

  useEffect(() => {
    if (prevNetworkRef.current === "offline" && status.network === "online") {
      setShowReconnect(true)
    }
    prevNetworkRef.current = status.network
  }, [status.network])

  const dismissReconnect = useCallback(() => setShowReconnect(false), [])

  // Delayed install prompt — show after 5s if available and not standalone
  const [showInstall, setShowInstall] = useState(false)
  useEffect(() => {
    if (installState !== "available") return
    if (status.isStandalone) return
    const timer = setTimeout(() => setShowInstall(true), 5_000)
    return () => clearTimeout(timer)
  }, [installState, status.isStandalone])

  function handleInstall() {
    setShowInstall(false)
    promptInstall()
  }
  function handleDismissInstall() {
    setShowInstall(false)
    dismissInstall()
  }

  // Priority: offline banner > update banner > reconnect toast > install banner
  // Only one shows at a time to avoid stacking
  const isOffline = status.network === "offline"
  const hasUpdate = updateState === "available" || updateState === "activating"
  const showInstallBanner = showInstall && !isOffline && !hasUpdate

  return (
    <>
      {children}

      {/* Platform banners — rendered at the bottom of the shell so they sit
          above the bottom nav but below modals/toasts */}
      <div className="fixed bottom-[72px] left-0 right-0 z-40 mx-auto max-w-screen-sm md:max-w-screen-md">
        <OfflineBanner visible={isOffline} />
        <ReconnectToast visible={showReconnect && !isOffline} onDismiss={dismissReconnect} />
        <UpdateAvailableBanner visible={hasUpdate && !isOffline} onRefresh={activateUpdate} />
        <InstallBanner
          visible={showInstallBanner}
          onInstall={handleInstall}
          onDismiss={handleDismissInstall}
        />
      </div>
    </>
  )
}
