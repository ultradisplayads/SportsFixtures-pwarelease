"use client"

// Section 09 — Update Available Banner
// Shown when useUpdateAvailable reports state === "available".
// onRefresh should call activateUpdate() from the hook, which posts SKIP_WAITING.

import { RefreshCw } from "lucide-react"

interface UpdateAvailableBannerProps {
  visible: boolean
  onRefresh: () => void
}

export function UpdateAvailableBanner({ visible, onRefresh }: UpdateAvailableBannerProps) {
  if (!visible) return null

  return (
    <div className="mx-4 mb-3 animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
        <RefreshCw className="h-5 w-5 shrink-0 text-emerald-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-emerald-200">Update available</p>
          <p className="text-xs text-emerald-100/70">
            A newer version of Sports Fixtures is ready.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="shrink-0 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-emerald-400"
        >
          Refresh now
        </button>
      </div>
    </div>
  )
}
