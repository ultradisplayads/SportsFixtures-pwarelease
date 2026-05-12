"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Bell, CalendarClock, Eye, MapPin, Send, Tag, Target, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LogoBadge } from "@/components/logo-badge"
import { getDeviceToken } from "@/lib/favourites-api"

const CELTIC_TEAM_ID = "133714"

type Results = {
  recipients?: number
  delivered?: number
  failed?: number
  duplicates?: number
  cleanedUp?: number
  campaignId?: string
}

function isoLocal(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function AdminCampaignsPage() {
  const defaultKickoff = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(19, 45, 0, 0)
    return isoLocal(d)
  }, [])

  const [offerTitle, setOfferTitle] = useState("Celtic match night offer")
  const [offerMessage, setOfferMessage] = useState("Celtic fans nearby: watch the match here with live screens and offers.")
  const [ctaUrl, setCtaUrl] = useState("/venues")
  const [venueName, setVenueName] = useState("Partner Sports Bar")
  const [lat, setLat] = useState("12.9236")
  const [lng, setLng] = useState("100.8825")
  const [radiusKm, setRadiusKm] = useState("8")
  const [kickoffAt, setKickoffAt] = useState(defaultKickoff)
  const [offsetMinutes, setOffsetMinutes] = useState("60")
  const [campaignId, setCampaignId] = useState(`celtic-offer-${Date.now()}`)
  const [busy, setBusy] = useState<"save" | "test" | "results" | null>(null)
  const [notice, setNotice] = useState("")
  const [results, setResults] = useState<Results | null>(null)

  const scheduledAt = useMemo(() => {
    const kickoff = new Date(kickoffAt)
    const offset = Number(offsetMinutes || 0)
    if (!Number.isFinite(kickoff.getTime())) return ""
    return new Date(kickoff.getTime() - offset * 60 * 1000).toISOString()
  }, [kickoffAt, offsetMinutes])

  const notificationPayload = {
    title: offerTitle,
    message: offerMessage,
    url: ctaUrl,
    primaryUrl: ctaUrl,
    secondaryUrl: "/venues",
    category: "venue_offer",
    targetType: "team",
    teamIds: [CELTIC_TEAM_ID],
    lat: Number(lat),
    lng: Number(lng),
    radiusKm: Number(radiusKm),
    campaignId,
    tag: campaignId,
    actions: [
      { action: "primary", title: "View offer" },
      { action: "secondary", title: "Find bars" },
    ],
    requireInteraction: false,
  }

  async function saveCampaign() {
    setBusy("save")
    setNotice("")
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...notificationPayload,
          venueName,
          kickoffAt,
          scheduledAt,
          offer: { title: offerTitle, message: offerMessage, ctaUrl },
          audience: {
            label: "Celtic fans within 8km",
            favouriteTeamId: CELTIC_TEAM_ID,
            radiusKm: Number(radiusKm),
            lat: Number(lat),
            lng: Number(lng),
          },
        }),
      })
      const data = await res.json()
      setNotice(data.strapiSaved ? "Campaign saved to Strapi." : "Campaign created locally; Strapi campaign collection did not confirm save.")
    } catch {
      setNotice("Campaign save failed.")
    } finally {
      setBusy(null)
    }
  }

  async function sendTest() {
    setBusy("test")
    setNotice("")
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...notificationPayload,
          targetType: "device",
          deviceToken: getDeviceToken(),
          campaignId: `${campaignId}-test`,
          tag: `${campaignId}-test`,
          title: `[TEST] ${offerTitle}`,
        }),
      })
      const data = await res.json()
      setResults(data)
      setNotice(res.ok ? "Test notification sent to this device target." : data.error || "Test send failed.")
    } catch {
      setNotice("Test send failed.")
    } finally {
      setBusy(null)
    }
  }

  async function loadResults() {
    setBusy("results")
    try {
      const res = await fetch(`/api/admin/campaigns?campaignId=${encodeURIComponent(campaignId)}`, { cache: "no-store" })
      const data = await res.json()
      setResults(data.metrics?.[0] || data.audits?.[0] || { campaignId })
      setNotice("Results refreshed.")
    } catch {
      setNotice("Results refresh failed.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-sidebar px-4 py-3">
        <Link href="/admin" className="text-sidebar-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <LogoBadge size={28} linked={false} />
        <div>
          <h1 className="text-sm font-bold text-sidebar-foreground">Campaigns</h1>
          <p className="text-[10px] text-sidebar-foreground/60">Offer targeting and push operations</p>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-4 p-4 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold">Create Offer</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs font-semibold">
                Offer headline
                <Input value={offerTitle} onChange={(e) => setOfferTitle(e.target.value)} />
              </label>
              <label className="space-y-1 text-xs font-semibold">
                Venue / sponsor
                <Input value={venueName} onChange={(e) => setVenueName(e.target.value)} />
              </label>
              <label className="space-y-1 text-xs font-semibold sm:col-span-2">
                Notification copy
                <Input value={offerMessage} onChange={(e) => setOfferMessage(e.target.value)} />
              </label>
              <label className="space-y-1 text-xs font-semibold sm:col-span-2">
                CTA URL
                <Input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} />
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold">Targeting</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
                <div className="flex items-center gap-2 text-sm font-bold"><Trophy className="h-4 w-4" /> Celtic fans</div>
                <p className="mt-1 text-xs text-muted-foreground">Favourite team ID {CELTIC_TEAM_ID}</p>
              </div>
              <label className="space-y-1 text-xs font-semibold">
                Latitude
                <Input value={lat} onChange={(e) => setLat(e.target.value)} />
              </label>
              <label className="space-y-1 text-xs font-semibold">
                Longitude
                <Input value={lng} onChange={(e) => setLng(e.target.value)} />
              </label>
              <label className="space-y-1 text-xs font-semibold">
                Radius km
                <Input value={radiusKm} onChange={(e) => setRadiusKm(e.target.value)} />
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold">Schedule Before Kick-off</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="space-y-1 text-xs font-semibold">
                Kick-off
                <Input type="datetime-local" value={kickoffAt} onChange={(e) => setKickoffAt(e.target.value)} />
              </label>
              <label className="space-y-1 text-xs font-semibold">
                Minutes before
                <Input value={offsetMinutes} onChange={(e) => setOffsetMinutes(e.target.value)} />
              </label>
              <label className="space-y-1 text-xs font-semibold">
                Campaign ID
                <Input value={campaignId} onChange={(e) => setCampaignId(e.target.value)} />
              </label>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Scheduled send: {scheduledAt || "Invalid kick-off time"}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={saveCampaign} disabled={busy !== null}>
              <CalendarClock className="mr-2 h-4 w-4" />
              {busy === "save" ? "Saving..." : "Save campaign"}
            </Button>
            <Button variant="outline" onClick={sendTest} disabled={busy !== null}>
              <Send className="mr-2 h-4 w-4" />
              {busy === "test" ? "Sending..." : "Send test"}
            </Button>
            <Button variant="outline" onClick={loadResults} disabled={busy !== null}>
              <Eye className="mr-2 h-4 w-4" />
              {busy === "results" ? "Loading..." : "View results"}
            </Button>
          </div>
          {notice && <p className="text-sm text-muted-foreground">{notice}</p>}
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold">Preview Notification</h2>
            </div>
            <div className="rounded-2xl border border-border bg-background p-3 shadow-sm">
              <p className="text-sm font-bold">{offerTitle}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{offerMessage}</p>
              <div className="mt-3 flex gap-2">
                <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground">View offer</span>
                <span className="rounded-full border border-border px-3 py-1 text-[11px] font-bold">Find bars</span>
              </div>
            </div>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <p className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Celtic fans within {radiusKm || 8}km</p>
              <p>Category: venue_offer</p>
              <p>URL: {ctaUrl}</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-bold">Results</h2>
            {results ? (
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(results).slice(0, 8).map(([key, value]) => (
                  <div key={key} className="rounded-lg bg-muted p-2">
                    <div className="text-[10px] uppercase text-muted-foreground">{key}</div>
                    <div className="font-bold">{String(value ?? "-")}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No results loaded yet.</p>
            )}
          </div>
        </aside>
      </main>
    </div>
  )
}
