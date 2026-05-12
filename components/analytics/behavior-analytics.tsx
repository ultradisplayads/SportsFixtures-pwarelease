"use client"

import { useEffect, useMemo, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { analytics } from "@/lib/analytics"

function textFor(element: Element): string {
  return (element.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80)
}

function pathFor(href: string): string {
  try {
    const url = new URL(href, window.location.origin)
    return `${url.pathname}${url.search}`
  } catch {
    return href
  }
}

function entityFromPath(path: string): { entityType?: string; entityId?: string } {
  const [, type, id] = path.split("/")
  if (!type || !id) return {}
  if (["match", "league", "team", "venue"].includes(type)) {
    return { entityType: type, entityId: id }
  }
  return {}
}

export function BehaviorAnalytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const page = useMemo(() => {
    const query = searchParams.toString()
    return query ? `${pathname}?${query}` : pathname
  }, [pathname, searchParams])
  const currentRef = useRef({ page, startedAt: Date.now() })

  useEffect(() => {
    const now = Date.now()
    const previous = currentRef.current

    if (previous.page !== page) {
      analytics.dwell(previous.page, now - previous.startedAt, { reason: "route_change" })
    }

    analytics.pageView(page, {
      referrer: previous.page !== page ? previous.page : document.referrer || undefined,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    })
    analytics.flush()
    currentRef.current = { page, startedAt: now }
  }, [page])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return

      const anchor = target.closest("a[href]")
      if (!anchor) return

      const href = anchor.getAttribute("href") || ""
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return

      const destination = pathFor(href)
      const entity = entityFromPath(destination)
      analytics.navigationClick(destination, {
        label: textFor(anchor),
        sourcePage: currentRef.current.page,
        section: anchor.closest("[data-section]")?.getAttribute("data-section") || undefined,
        isExternal: href.startsWith("http") && !href.startsWith(window.location.origin),
        entityType: entity.entityType,
        entityId: entity.entityId,
      })
    }

    const flushDwell = (reason: string) => {
      const current = currentRef.current
      analytics.dwell(current.page, Date.now() - current.startedAt, { reason })
    }

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        flushDwell("hidden")
      } else {
        currentRef.current = { page: currentRef.current.page, startedAt: Date.now() }
        analytics.flush()
      }
    }

    const handlePageHide = () => flushDwell("pagehide")
    const handleOnline = () => analytics.flush()

    document.addEventListener("click", handleClick, { capture: true })
    document.addEventListener("visibilitychange", handleVisibility)
    window.addEventListener("pagehide", handlePageHide)
    window.addEventListener("online", handleOnline)

    return () => {
      document.removeEventListener("click", handleClick, { capture: true })
      document.removeEventListener("visibilitychange", handleVisibility)
      window.removeEventListener("pagehide", handlePageHide)
      window.removeEventListener("online", handleOnline)
      flushDwell("unmount")
    }
  }, [])

  return null
}
