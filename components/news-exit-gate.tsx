"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react"
import { HeaderMenu } from "@/components/header-menu"
import { BottomNav } from "@/components/bottom-nav"
import { LiveTicker } from "@/components/live-ticker"
import { AdInjection } from "@/components/ad-injection"
import { LogoSquare } from "@/components/logo-badge"
import { triggerHaptic } from "@/lib/haptic-feedback"

type NewsExitGateProps = {
  targetUrl: string
  title: string
  source: string
  delaySeconds: number
  autoRedirect: boolean
  message: string
}

function getHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return "publisher"
  }
}

export function NewsExitGate({
  targetUrl,
  title,
  source,
  delaySeconds,
  autoRedirect,
  message,
}: NewsExitGateProps) {
  const [remaining, setRemaining] = useState(delaySeconds)
  const host = useMemo(() => getHost(targetUrl), [targetUrl])
  const canLeave = remaining <= 0

  useEffect(() => {
    setRemaining(delaySeconds)
  }, [delaySeconds, targetUrl])

  useEffect(() => {
    if (remaining <= 0) return
    const timer = window.setTimeout(() => setRemaining((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [remaining])

  useEffect(() => {
    if (!autoRedirect || remaining > 0) return
    const timer = window.setTimeout(() => {
      window.location.assign(targetUrl)
    }, 400)
    return () => window.clearTimeout(timer)
  }, [autoRedirect, remaining, targetUrl])

  const leave = () => {
    triggerHaptic("light")
    window.location.assign(targetUrl)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LiveTicker />
      <HeaderMenu />

      <main className="flex-1 px-4 pb-24 pt-4">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
          <Link href="/news" className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-semibold">
            <ArrowLeft className="h-4 w-4" />
            News
          </Link>

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex justify-center">
              <LogoSquare size={92} />
            </div>
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">Leaving Sports Fixtures</p>
                <h1 className="mt-1 text-xl font-bold leading-tight">Continue to publisher</h1>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">{message}</p>
              <h2 className="mt-3 text-lg font-bold leading-snug">{title || "Read the full story"}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {source || host} · {host}
              </p>
            </div>

            <AdInjection placement="news" index={0} className="my-4" />

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={leave}
                disabled={!canLeave}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {canLeave ? "Continue to source" : `Continue in ${remaining}s`}
                <ExternalLink className="h-4 w-4" />
              </button>
              <Link
                href="/news"
                className="inline-flex flex-1 items-center justify-center rounded-lg border border-border px-4 py-3 text-sm font-bold"
              >
                Stay in app
              </Link>
            </div>
          </section>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
