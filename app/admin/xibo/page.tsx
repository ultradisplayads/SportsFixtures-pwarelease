"use client"

// app/admin/xibo/page.tsx
// Xibo Signage Control — push fixture content to venue screens

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft, Monitor, CheckCircle, XCircle, Clock,
  Zap, RefreshCw, Tv, AlertCircle, Settings, X,
  ChevronDown, ChevronUp, Save, Plus, Trash2,
} from "lucide-react"
import { LogoBadge } from "@/components/logo-badge"

// ─── Types ────────────────────────────────────────────────────────────────────

interface VenueXiboStatus {
  id: number
  name: string
  city?: string
  xiboEnabled: boolean
  xiboDisplayGroupId: number | null
  xiboLayoutId: number | null
  lastXiboPush: string | null
  isConfigured: boolean
  isProvisioned: boolean
}

interface VenueSettings {
  logoUrl: string
  templateTier: "standard" | "premium" | "custom"
  selectedTeams: number[]
  selectedLeagues: number[]
  screenOrientation: "landscape" | "portrait"
}

type PushState = Record<number, "idle" | "pushing" | "success" | "error">
type SaveState = Record<number, "idle" | "saving" | "saved" | "error">

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLastPush(iso: string | null): string {
  if (!iso) return "Never"
  const d = new Date(iso)
  const diffMs = Date.now() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return "Yesterday"
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

function StatusDot({ enabled }: { enabled: boolean }) {
  return (
    <span className={`inline-block h-2 w-2 rounded-full shrink-0 ${
      enabled ? "bg-green-500" : "bg-muted-foreground/30"
    }`} />
  )
}

// ─── Settings Panel ───────────────────────────────────────────────────────────

function VenueSettingsPanel({
  venue,
  onSaved,
  onClose,
}: {
  venue: VenueXiboStatus
  onSaved: () => void
  onClose: () => void
}) {
  const [settings, setSettings] = useState<VenueSettings>({
    logoUrl: "",
    templateTier: "standard",
    selectedTeams: [],
    selectedLeagues: [],
    screenOrientation: "landscape",
  })
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [enableState, setEnableState] = useState<"idle" | "saving">("idle")
  const [error, setError] = useState("")
  const [teamInput, setTeamInput] = useState("")
  const [leagueInput, setLeagueInput] = useState("")

  // Load current settings from status endpoint
  useEffect(() => {
    fetch(`/api/venues/${venue.id}/xibo/status`)
      .then(r => r.json())
      .then(json => {
        const d = json.data
        if (d) {
          setSettings({
            logoUrl: d.logoUrl || "",
            templateTier: d.templateTier || "standard",
            selectedTeams: d.selectedTeams || [],
            selectedLeagues: d.selectedLeagues || [],
            screenOrientation: d.screenOrientation || "landscape",
          })
        }
      })
      .catch(() => {})
  }, [venue.id])

  async function handleSave() {
    setSaveState("saving")
    setError("")
    try {
      const res = await fetch(`/api/venues/${venue.id}/xibo/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logoUrl: settings.logoUrl || undefined,
          templateTier: settings.templateTier,
          selectedTeams: settings.selectedTeams,
          selectedLeagues: settings.selectedLeagues,
          screenOrientation: settings.screenOrientation,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || "Save failed")
      setSaveState("saved")
      setTimeout(() => setSaveState("idle"), 2000)
      onSaved()
    } catch (err: any) {
      setSaveState("error")
      setError(err.message)
    }
  }

  async function handleToggleEnable() {
    setEnableState("saving")
    try {
      const res = await fetch(`/api/venues/${venue.id}/xibo/enable`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !venue.xiboEnabled }),
      })
      if (!res.ok) throw new Error("Toggle failed")
      onSaved()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setEnableState("idle")
    }
  }

  function addTeam() {
    const id = parseInt(teamInput.trim())
    if (!isNaN(id) && !settings.selectedTeams.includes(id)) {
      setSettings(s => ({ ...s, selectedTeams: [...s.selectedTeams, id] }))
    }
    setTeamInput("")
  }

  function removeTeam(id: number) {
    setSettings(s => ({ ...s, selectedTeams: s.selectedTeams.filter(t => t !== id) }))
  }

  function addLeague() {
    const id = parseInt(leagueInput.trim())
    if (!isNaN(id) && !settings.selectedLeagues.includes(id)) {
      setSettings(s => ({ ...s, selectedLeagues: [...s.selectedLeagues, id] }))
    }
    setLeagueInput("")
  }

  function removeLeague(id: number) {
    setSettings(s => ({ ...s, selectedLeagues: s.selectedLeagues.filter(l => l !== id) }))
  }

  return (
    <div className="border-t border-border bg-muted/30 p-4 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Settings className="h-4 w-4 text-primary" />
          Xibo Settings — {venue.name}
        </p>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Enable toggle */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
        <div>
          <p className="text-sm font-medium">Xibo Enabled</p>
          <p className="text-xs text-muted-foreground">Push fixture content to this venue's screens daily</p>
        </div>
        <button
          onClick={handleToggleEnable}
          disabled={enableState === "saving"}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            venue.xiboEnabled ? "bg-green-500" : "bg-muted-foreground/30"
          } disabled:opacity-50`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            venue.xiboEnabled ? "translate-x-6" : "translate-x-1"
          }`} />
        </button>
      </div>

      {/* Logo URL */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Logo URL
        </label>
        <input
          type="url"
          placeholder="https://cdn.example.com/logo.png"
          value={settings.logoUrl}
          onChange={e => setSettings(s => ({ ...s, logoUrl: e.target.value }))}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
        />
        {settings.logoUrl && (
          <img
            src={settings.logoUrl}
            alt="Logo preview"
            className="h-10 w-auto rounded object-contain border border-border"
            onError={e => (e.currentTarget.style.display = "none")}
          />
        )}
      </div>

      {/* Template Tier */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Template Tier
        </label>
        <div className="flex gap-2">
          {(["standard", "premium", "custom"] as const).map(tier => (
            <button
              key={tier}
              onClick={() => setSettings(s => ({ ...s, templateTier: tier }))}
              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold capitalize transition-colors ${
                settings.templateTier === tier
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-accent"
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Screen Orientation */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Screen Orientation
        </label>
        <div className="flex gap-2">
          {(["landscape", "portrait"] as const).map(o => (
            <button
              key={o}
              onClick={() => setSettings(s => ({ ...s, screenOrientation: o }))}
              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold capitalize transition-colors ${
                settings.screenOrientation === o
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-accent"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Teams */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Team IDs (from TheSportsDB)
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="e.g. 133604"
            value={teamInput}
            onChange={e => setTeamInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addTeam()}
            className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={addTeam}
            className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
        {settings.selectedTeams.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {settings.selectedTeams.map(id => (
              <span key={id} className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {id}
                <button onClick={() => removeTeam(id)} className="ml-0.5 hover:text-red-500">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Selected Leagues */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          League IDs (from TheSportsDB)
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="e.g. 4328"
            value={leagueInput}
            onChange={e => setLeagueInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addLeague()}
            className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={addLeague}
            className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
        {settings.selectedLeagues.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {settings.selectedLeagues.map(id => (
              <span key={id} className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                {id}
                <button onClick={() => removeLeague(id)} className="ml-0.5 hover:text-red-500">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saveState === "saving"}
        className={`w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
          saveState === "saved"
            ? "bg-green-500 text-white"
            : saveState === "error"
            ? "bg-red-500 text-white"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        } disabled:opacity-50`}
      >
        {saveState === "saving" && <RefreshCw className="h-4 w-4 animate-spin" />}
        {saveState === "saved" && <CheckCircle className="h-4 w-4" />}
        {saveState === "error" && <XCircle className="h-4 w-4" />}
        {saveState === "idle" && <Save className="h-4 w-4" />}
        {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved!" : saveState === "error" ? "Failed" : "Save Settings"}
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function XiboAdminPage() {
  const [venues, setVenues] = useState<VenueXiboStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pushState, setPushState] = useState<PushState>({})
  const [pushMessage, setPushMessage] = useState<Record<number, string>>({})
  const [expandedVenue, setExpandedVenue] = useState<number | null>(null)

  async function loadVenues() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/xibo/venues")
      if (!res.ok) throw new Error("Failed to load venues")
      const data = await res.json()
      setVenues(data.venues || [])
    } catch (err: any) {
      setError(err.message || "Failed to load venues")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadVenues() }, [])

  async function handlePush(venueId: number) {
    setPushState(s => ({ ...s, [venueId]: "pushing" }))
    setPushMessage(m => ({ ...m, [venueId]: "" }))
    try {
      const res = await fetch(`/api/venues/${venueId}/xibo/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || "Push failed")
      setPushState(s => ({ ...s, [venueId]: "success" }))
      setPushMessage(m => ({ ...m, [venueId]: `Layout ${data.data?.xiboLayoutId} pushed` }))
      await loadVenues()
    } catch (err: any) {
      setPushState(s => ({ ...s, [venueId]: "error" }))
      setPushMessage(m => ({ ...m, [venueId]: err.message }))
    } finally {
      setTimeout(() => setPushState(s => ({ ...s, [venueId]: "idle" })), 4000)
    }
  }

  async function handlePushAll() {
    for (const venue of venues.filter(v => v.xiboEnabled)) {
      await handlePush(venue.id)
    }
  }

  const enabledCount = venues.filter(v => v.xiboEnabled).length
  const provisionedCount = venues.filter(v => v.isProvisioned).length
  const neverPushedCount = venues.filter(v => v.xiboEnabled && !v.lastXiboPush).length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-sidebar px-4 py-3">
        <Link href="/admin" className="text-sidebar-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <LogoBadge size={28} linked={false} />
        <div className="flex-1">
          <h1 className="text-sm font-bold text-sidebar-foreground">Xibo Signage</h1>
          <p className="text-[10px] text-sidebar-foreground/60">Digital Signage Control Panel</p>
        </div>
        <button
          onClick={loadVenues}
          disabled={loading}
          className="rounded-lg p-1.5 text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </header>

      <div className="mx-auto max-w-2xl space-y-4 p-4">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-2xl font-bold text-green-500">{enabledCount}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Enabled</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-2xl font-bold text-primary">{provisionedCount}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Provisioned</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-2xl font-bold text-amber-500">{neverPushedCount}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Never Pushed</p>
          </div>
        </div>

        {/* Push All */}
        {enabledCount > 0 && (
          <button
            onClick={handlePushAll}
            disabled={Object.values(pushState).some(s => s === "pushing")}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Zap className="h-4 w-4" />
            Push All Enabled Venues ({enabledCount})
          </button>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-card" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && venues.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <Tv className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium">No venues found</p>
          </div>
        )}

        {/* Venue list */}
        {!loading && venues.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{venues.length} venues total</p>
            {venues.map((venue) => {
              const state = pushState[venue.id] || "idle"
              const msg = pushMessage[venue.id] || ""
              const isExpanded = expandedVenue === venue.id

              return (
                <div key={venue.id} className="overflow-hidden rounded-xl border border-border bg-card">
                  {/* Venue row */}
                  <div className="flex items-center gap-3 p-4">
                    <StatusDot enabled={venue.xiboEnabled} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{venue.name}</p>
                      {venue.city && (
                        <p className="text-xs text-muted-foreground">{venue.city}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Settings toggle */}
                      <button
                        onClick={() => setExpandedVenue(isExpanded ? null : venue.id)}
                        className="flex items-center gap-1 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
                      >
                        <Settings className="h-3 w-3" />
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>

                      {/* Push button */}
                      <button
                        onClick={() => handlePush(venue.id)}
                        disabled={state === "pushing"}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                          state === "success" ? "bg-green-500/15 text-green-600 dark:text-green-400"
                          : state === "error" ? "bg-red-500/15 text-red-600 dark:text-red-400"
                          : state === "pushing" ? "bg-primary/10 text-primary"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                        } disabled:opacity-70`}
                      >
                        {state === "pushing" && <RefreshCw className="h-3 w-3 animate-spin" />}
                        {state === "success" && <CheckCircle className="h-3 w-3" />}
                        {state === "error" && <XCircle className="h-3 w-3" />}
                        {state === "idle" && <Zap className="h-3 w-3" />}
                        {state === "pushing" ? "Pushing..." : state === "success" ? "Done" : state === "error" ? "Failed" : "Push"}
                      </button>
                    </div>
                  </div>

                  {/* Status chips */}
                  <div className="flex flex-wrap gap-1.5 px-4 pb-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      venue.xiboEnabled ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-muted text-muted-foreground"
                    }`}>
                      {venue.xiboEnabled ? <CheckCircle className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
                      {venue.xiboEnabled ? "Enabled" : "Disabled"}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      venue.isProvisioned ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-muted text-muted-foreground"
                    }`}>
                      <Monitor className="h-2.5 w-2.5" />
                      {venue.isProvisioned ? `Group ${venue.xiboDisplayGroupId}` : "Not provisioned"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      <Clock className="h-2.5 w-2.5" />
                      {formatLastPush(venue.lastXiboPush)}
                    </span>
                    {venue.xiboLayoutId && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                        <Tv className="h-2.5 w-2.5" />
                        Layout {venue.xiboLayoutId}
                      </span>
                    )}
                    {msg && (
                      <span className={`text-[10px] ${state === "error" ? "text-red-500" : "text-green-600 dark:text-green-400"}`}>
                        {msg}
                      </span>
                    )}
                  </div>

                  {/* Inline settings panel */}
                  {isExpanded && (
                    <VenueSettingsPanel
                      venue={venue}
                      onSaved={loadVenues}
                      onClose={() => setExpandedVenue(null)}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground pb-4">
          Daily auto-push runs at 06:00. Use Push Now to trigger immediately.
        </p>
      </div>
    </div>
  )
}