"use client"

/** Explicit app brand icon for push notification previews — not a sports entity fallback. */
const APP_BRAND_ICON = "/logo.png"

import { useState } from "react"
import { Send, Users, MapPin, Wifi, Star, Trophy, Globe, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { LogoBadge } from "@/components/logo-badge"

type TargetType = "all" | "online" | "location" | "team" | "league" | "tier" | "country"

const TARGET_TYPES: { id: TargetType; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "all",      label: "All Users",        icon: <Users className="h-4 w-4" />,   desc: "Every subscribed device" },
  { id: "online",   label: "Currently Online", icon: <Wifi className="h-4 w-4" />,    desc: "Active in last 30 minutes" },
  { id: "location", label: "By Location",      icon: <MapPin className="h-4 w-4" />,  desc: "Within radius of a venue/location" },
  { id: "team",     label: "By Team",          icon: <Star className="h-4 w-4" />,    desc: "Users following specific teams" },
  { id: "league",   label: "By Competition",   icon: <Trophy className="h-4 w-4" />,  desc: "Users following specific leagues" },
  { id: "tier",     label: "By Tier",          icon: <Star className="h-4 w-4" />,    desc: "Target by subscription plan" },
  { id: "country",  label: "By Country",       icon: <Globe className="h-4 w-4" />,   desc: "Users in a specific country" },
]

const KNOWN_TEAMS = [
  { id: "133719", name: "Celtic FC" },
  { id: "133604", name: "Rangers FC" },
  { id: "133612", name: "Aberdeen" },
  { id: "134785", name: "Hearts" },
  { id: "133597", name: "Hibernian" },
]

const KNOWN_LEAGUES = [
  { id: "4330", name: "Scottish Premiership" },
  { id: "4328", name: "Premier League" },
  { id: "4480", name: "Champions League" },
  { id: "4346", name: "Thai League 1" },
  { id: "4335", name: "La Liga" },
  { id: "4331", name: "Bundesliga" },
]

const TIERS = ["bronze", "silver", "gold"]

export default function AdminPushPage() {
  const [targetType, setTargetType] = useState<TargetType>("all")
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [url, setUrl] = useState("/")
  const [iconUrl, setIconUrl] = useState(APP_BRAND_ICON)

  // Location targeting
  const [lat, setLat] = useState("")
  const [lng, setLng] = useState("")
  const [radiusKm, setRadiusKm] = useState("5")

  // Team targeting
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [customTeamId, setCustomTeamId] = useState("")

  // League targeting
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>([])

  // Tier targeting
  const [selectedTiers, setSelectedTiers] = useState<string[]>([])

  // Country targeting
  const [country, setCountry] = useState("")

  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ success: boolean; recipients?: number; delivered?: number; failed?: number; error?: string } | null>(null)

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return
    setSending(true)
    setResult(null)
    try {
      const body: Record<string, any> = {
        targetType, title, message, url, iconUrl,
        notificationType: "admin",
      }
      if (targetType === "location") {
        body.lat = parseFloat(lat)
        body.lng = parseFloat(lng)
        body.radiusKm = parseFloat(radiusKm)
      } else if (targetType === "team") {
        const ids = [...selectedTeams, ...(customTeamId ? [customTeamId] : [])]
        body.teamIds = ids
      } else if (targetType === "league") {
        body.leagueIds = selectedLeagues
      } else if (targetType === "tier") {
        body.tiers = selectedTiers
      } else if (targetType === "country") {
        body.country = country
      }

      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      setResult(data)
    } catch (e: any) {
      setResult({ success: false, error: e.message })
    } finally {
      setSending(false)
    }
  }

  const toggleTeam = (id: string) =>
    setSelectedTeams((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id])

  const toggleLeague = (id: string) =>
    setSelectedLeagues((prev) => prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id])

  const toggleTier = (t: string) =>
    setSelectedTiers((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-sidebar px-4 py-3">
        <Link href="/" className="text-sidebar-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <LogoBadge size={28} linked={false} />
        <div>
          <h1 className="text-sm font-bold text-sidebar-foreground">Push Notifications</h1>
          <p className="text-[10px] text-sidebar-foreground/60">Admin Dashboard</p>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-4 p-4">

        {/* Target selector */}
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">1. Select Target Audience</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {TARGET_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTargetType(t.id)}
                className={`flex flex-col gap-1 rounded-lg border p-3 text-left transition-all ${
                  targetType === t.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-1.5 font-medium text-xs">{t.icon}{t.label}</div>
                <p className="text-[10px] text-muted-foreground leading-tight">{t.desc}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Location targeting fields */}
        {targetType === "location" && (
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">Location Settings</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Latitude</label>
                  <input
                    type="number"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    placeholder="e.g. 13.7563"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Longitude</label>
                  <input
                    type="number"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    placeholder="e.g. 100.5018"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Radius (km) — e.g. 5km around a bar</label>
                <input
                  type="number"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(e.target.value)}
                  placeholder="5"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                Tip: Enter the coordinates of a venue to push all nearby users within the radius. Useful for bars, stadiums, and local advertisers.
              </p>
            </div>
          </Card>
        )}

        {/* Team targeting */}
        {targetType === "team" && (
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">Select Teams</h2>
            <div className="flex flex-wrap gap-2">
              {KNOWN_TEAMS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => toggleTeam(t.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                    selectedTeams.includes(t.id)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Custom Team ID (TheSportsDB)</label>
              <input
                value={customTeamId}
                onChange={(e) => setCustomTeamId(e.target.value)}
                placeholder="e.g. 133619"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </Card>
        )}

        {/* League targeting */}
        {targetType === "league" && (
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">Select Competitions</h2>
            <div className="flex flex-wrap gap-2">
              {KNOWN_LEAGUES.map((l) => (
                <button
                  key={l.id}
                  onClick={() => toggleLeague(l.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                    selectedLeagues.includes(l.id)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  {l.name}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Tier targeting */}
        {targetType === "tier" && (
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">Select Subscription Tiers</h2>
            <div className="flex flex-wrap gap-2">
              {TIERS.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleTier(t)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-all ${
                    selectedTiers.includes(t)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Country targeting */}
        {targetType === "country" && (
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">Target Country</h2>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. TH, GB, DE"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </Card>
        )}

        {/* Message composer */}
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">2. Compose Notification</h2>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Title *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                placeholder="e.g. Celtic 2-0 Rangers — Full Time!"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Message *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={200}
                rows={3}
                placeholder="e.g. Kyogo with a hat-trick. Watch full highlights now."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none resize-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Deep Link URL (tap destination)</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="/match/..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Icon URL</label>
              <input
                value={iconUrl}
                onChange={(e) => setIconUrl(e.target.value)}
                    placeholder={APP_BRAND_ICON}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </Card>

        {/* Preview */}
        {(title || message) && (
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">Preview</h2>
            <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={iconUrl || APP_BRAND_ICON} alt="" className="h-10 w-10 rounded-lg object-contain" />
              <div className="flex-1 min-w-0">
                <p className="truncate font-semibold text-sm">{title || "Notification Title"}</p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-snug line-clamp-2">{message || "Your message here..."}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">sportsfixtures.net</p>
              </div>
            </div>
          </Card>
        )}

        {/* Send result */}
        {result && (
          <Card className={`p-4 ${result.success ? "border-primary/40 bg-primary/5" : "border-destructive/40 bg-destructive/5"}`}>
            {result.success ? (
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-primary">Sent successfully</p>
                <p className="text-muted-foreground">Recipients: <span className="text-foreground font-medium">{result.recipients}</span></p>
                <p className="text-muted-foreground">Delivered: <span className="text-foreground font-medium">{result.delivered}</span></p>
                {(result.failed ?? 0) > 0 && (
                  <p className="text-muted-foreground">Failed / stale: <span className="text-destructive font-medium">{result.failed}</span> (auto-removed)</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-destructive">{result.error || "Send failed"}</p>
            )}
          </Card>
        )}

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={sending || !title.trim() || !message.trim()}
          className="w-full gap-2"
          size="lg"
        >
          <Send className="h-4 w-4" />
          {sending ? "Sending..." : "Send Push Notification"}
        </Button>

        <p className="pb-8 text-center text-xs text-muted-foreground">
          Notifications are delivered via Web Push (VAPID). Stale subscriptions are automatically removed on 410 responses.
        </p>
      </div>
    </div>
  )
}
