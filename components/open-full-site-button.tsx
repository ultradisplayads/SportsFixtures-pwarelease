"use client"

import { useEffect, useMemo, useState, Suspense } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { ExternalLink, MonitorSmartphone, X } from "lucide-react"

const FULL_SITE_URL = process.env.NEXT_PUBLIC_FULL_SITE_URL || "https://sportsfixtures.net"
const PREFERENCE_KEY = "sf_compact_view_until"
const DISMISS_DAYS = 7

function getDismissUntil() {
  if (typeof window === "undefined") return 0
  const raw = window.localStorage.getItem(PREFERENCE_KEY)
  return raw ? Number(raw) || 0 : 0
}

function setDismissUntil(days: number) {
  if (typeof window === "undefined") return
  const until = Date.now() + days * 24 * 60 * 60 * 1000
  window.localStorage.setItem(PREFERENCE_KEY, String(until))
}

function OpenFullSiteButtonInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [visible, setVisible] = useState(false)
  const [portraitTablet, setPortraitTablet] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const standaloneQuery = window.matchMedia("(display-mode: standalone)")
    const wideQuery = window.matchMedia("(min-width: 768px)")
    const portraitTabletQuery = window.matchMedia(
      "(min-width: 768px) and (max-width: 1024px) and (orientation: portrait)"
    )

    const update = () => {
      const dismissed = getDismissUntil() > Date.now()
      const standalone = standaloneQuery.matches || Boolean((window.navigator as any).standalone)
      const wide = wideQuery.matches
      setPortraitTablet(portraitTabletQuery.matches)
      setVisible(!standalone && wide && !dismissed)
    }

    update()
    standaloneQuery.addEventListener?.("change", update)
    wideQuery.addEventListener?.("change", update)
    portraitTabletQuery.addEventListener?.("change", update)
    window.addEventListener("resize", update)
    window.addEventListener("orientationchange", update)
    window.addEventListener("storage", update)

    return () => {
      standaloneQuery.removeEventListener?.("change", update)
      wideQuery.removeEventListener?.("change", update)
      portraitTabletQuery.removeEventListener?.("change", update)
      window.removeEventListener("resize", update)
      window.removeEventListener("orientationchange", update)
      window.removeEventListener("storage", update)
    }
  }, [])

  const href = useMemo(() => {
    const url = new URL(FULL_SITE_URL)
    url.pathname = pathname || "/"
    const query = searchParams?.toString()
    url.search = query ? `?${query}` : ""
    return url.toString()
  }, [pathname, searchParams])

  if (!visible) return null

  return (
    <div className="fixed inset-x-4 top-4 z-50 mx-auto max-w-xl rounded-2xl border border-border bg-background/95 p-3 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
          <MonitorSmartphone className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Open the full SportsFixtures.net site?</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {portraitTablet
              ? "This compact PWA is tuned for phones. On a portrait tablet, the full site usually gives you a better browsing layout."
              : "The compact PWA stays phone-first. On wider screens, the full site usually gives you a better browsing layout."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            
             <a href={href}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
            >
              Open full site
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button
              type="button"
              onClick={() => {
                setDismissUntil(DISMISS_DAYS)
                setVisible(false)
              }}
              className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-semibold"
            >
              Keep compact view
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setDismissUntil(DISMISS_DAYS)
            setVisible(false)
          }}
          className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function OpenFullSiteButton() {
  return (
    <Suspense fallback={null}>
      <OpenFullSiteButtonInner />
    </Suspense>
  )
}