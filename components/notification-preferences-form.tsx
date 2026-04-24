"use client"

/**
 * components/notification-preferences-form.tsx
 *
 * Section 02 — Full notification preferences form.
 * Used in app/settings/notifications/page.tsx.
 *
 * Sections:
 *   1. Push toggle (requests browser permission if not granted)
 *   2. In-app notifications toggle + Global mute
 *   3. Alert priority tiers (tier1, tier2, tier3) — explicit controls
 *   4. All alert categories — ALL 14 categories exposed
 *   5. Optional channels (breaking news, transfer news, venue offers)
 *   6. Default reminder offsets — full 7-step ladder (24h → 5m)
 *   7. Quiet hours
 *   8. Active subscriptions list
 */

import { useState, useCallback } from "react"
import {
  Bell, BellOff, Clock, Trophy, Newspaper, MapPin,
  Moon, Check, Shield, X, AlertTriangle
} from "lucide-react"
import { useNotifications } from "@/hooks/use-notifications"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { registerPushSubscription } from "@/lib/push-registration"
import type { NotificationCategory } from "@/types/notifications"

// ── Full category definitions (all 14) ───────────────────────────────────────

const CATEGORY_DEFS: { id: NotificationCategory; label: string; description: string }[] = [
  // Tier 1 — Critical
  { id: "goal",          label: "Goals",          description: "Instant goal alerts" },
  { id: "red_card",      label: "Red Cards",       description: "Instant red card alerts" },
  { id: "full_time",     label: "Full Time",       description: "Final score when the match ends" },
  { id: "breaking_news", label: "Breaking News",   description: "Major transfers, injuries, and managerial changes" },
  // Tier 2 — Important
  { id: "kickoff",       label: "Kick-off",        description: "Alert when a match starts" },
  { id: "lineups",       label: "Lineups",         description: "Alert when confirmed lineups are released" },
  { id: "half_time",     label: "Half Time",       description: "Score at the break" },
  { id: "extra_time",    label: "Extra Time",      description: "Alert when extra time begins" },
  { id: "penalties",     label: "Penalties",       description: "Alert when a penalty shootout starts" },
  { id: "postponed",     label: "Postponed",       description: "Alert when a match is postponed" },
  { id: "cancelled",     label: "Cancelled",       description: "Alert when a match is cancelled" },
  // Tier 3 — Low priority
  { id: "match_reminder",label: "Match Reminders", description: "Alerts before kick-off based on your chosen offsets" },
  { id: "transfer_news", label: "Transfer News",   description: "Rumours and confirmed signings for followed teams" },
  { id: "venue_offer",   label: "Venue Offers",    description: "Deals from saved venues near upcoming matches" },
]

// ── Full 7-step reminder offset ladder ───────────────────────────────────────

const OFFSET_DEFS: { value: string; label: string }[] = [
  { value: "24h", label: "24 hours" },
  { value: "12h", label: "12 hours" },
  { value: "3h",  label: "3 hours"  },
  { value: "1h",  label: "1 hour"   },
  { value: "30m", label: "30 minutes" },
  { value: "15m", label: "15 minutes" },
  { value: "5m",  label: "5 minutes"  },
]

// ── Tier definitions ──────────────────────────────────────────────────────────

const TIER_DEFS = [
  {
    key:   "tier1_enabled" as const,
    label: "Tier 1 — Critical",
    desc:  "Goals, red cards, full time, breaking news",
  },
  {
    key:   "tier2_enabled" as const,
    label: "Tier 2 — Important",
    desc:  "Kick-off, lineups, half time, extra time, penalties, postponed/cancelled",
  },
  {
    key:   "tier3_enabled" as const,
    label: "Tier 3 — Low Priority",
    desc:  "Match reminders, venue offers, transfer news",
  },
]

// ── Toggle row ────────────────────────────────────────────────────────────────

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${disabled ? "text-muted-foreground" : "text-foreground"}`}>
          {label}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground leading-snug mt-0.5">{description}</p>
        )}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => { triggerHaptic("selection"); onChange(!checked) }}
        className={[
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          disabled ? "opacity-40 cursor-not-allowed" : "",
          checked ? "bg-primary" : "bg-muted",
        ].join(" ")}
      >
        <span
          className={[
            "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform",
            checked ? "translate-x-5" : "translate-x-0",
          ].join(" ")}
        />
      </button>
    </div>
  )
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-2 mt-4">
      <Icon className="h-4 w-4 text-primary shrink-0" />
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
  )
}

// ── Main form ─────────────────────────────────────────────────────────────────

export function NotificationPreferencesForm() {
  const { preferences, subscriptions, updatePreferences, unsubscribe, pushGranted } = useNotifications()
  const [requestingPush, setRequestingPush] = useState(false)

  // ── Push enable handler ──────────────────────────────────────────────────────
  const handlePushToggle = useCallback(async (enabled: boolean) => {
    if (enabled && Notification.permission !== "granted") {
      setRequestingPush(true)
      try {
        const permission = await Notification.requestPermission()
        if (permission !== "granted") { setRequestingPush(false); return }
        await registerPushSubscription()
      } catch {
        setRequestingPush(false)
        return
      }
      setRequestingPush(false)
    }
    await updatePreferences({ push_enabled: enabled })
  }, [updatePreferences])

  // ── Category toggle ──────────────────────────────────────────────────────────
  const toggleCategory = useCallback((cat: NotificationCategory) => {
    const enabled  = [...preferences.enabled_categories]
    const disabled = [...preferences.disabled_categories]
    if (enabled.includes(cat)) {
      updatePreferences({
        enabled_categories:  enabled.filter((c) => c !== cat),
        disabled_categories: [...disabled, cat],
      })
    } else {
      updatePreferences({
        enabled_categories:  [...enabled, cat],
        disabled_categories: disabled.filter((c) => c !== cat),
      })
    }
    triggerHaptic("selection")
  }, [preferences, updatePreferences])

  // ── Offset toggle ────────────────────────────────────────────────────────────
  const toggleOffset = useCallback((offset: string) => {
    const current = preferences.default_reminder_offsets
    const next = current.includes(offset)
      ? current.filter((o) => o !== offset)
      : [...current, offset]
    if (next.length === 0) return
    updatePreferences({ default_reminder_offsets: next })
    triggerHaptic("selection")
  }, [preferences, updatePreferences])

  const pushBlocked = typeof Notification !== "undefined" && Notification.permission === "denied"

  const entityGroups = {
    team:        subscriptions.filter((s) => s.entity_type === "team"),
    competition: subscriptions.filter((s) => s.entity_type === "competition" || s.entity_type === "league"),
    player:      subscriptions.filter((s) => s.entity_type === "player"),
    event:       subscriptions.filter((s) => s.entity_type === "event"),
  }

  return (
    <div className="space-y-1 pb-8">

      {/* ── Push notifications ── */}
      <SectionHeader icon={Bell} title="Push Notifications" />
      <div className="rounded-xl border border-border bg-card px-4 divide-y divide-border/60">
        {pushBlocked ? (
          <div className="flex items-start gap-3 py-3">
            <BellOff className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">Blocked in browser</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Open your browser settings and allow notifications for this site, then come back here.
              </p>
            </div>
          </div>
        ) : (
          <ToggleRow
            label={requestingPush ? "Requesting permission…" : "Enable push notifications"}
            description={
              pushGranted === false
                ? "Tap to grant browser permission"
                : "Live match alerts, goals, and reminders sent to this device"
            }
            checked={preferences.push_enabled && (pushGranted ?? false)}
            onChange={handlePushToggle}
            disabled={requestingPush}
          />
        )}
        <ToggleRow
          label="In-app notification centre"
          description="Show alerts in the bell icon when you open the app"
          checked={preferences.in_app_enabled}
          onChange={(v) => updatePreferences({ in_app_enabled: v })}
        />
        <ToggleRow
          label="Mute all"
          description="Pause all notifications without removing your settings"
          checked={preferences.global_mute}
          onChange={(v) => updatePreferences({ global_mute: v })}
        />
      </div>

      {/* ── Alert priority tiers ── */}
      <SectionHeader icon={Shield} title="Alert Priority Tiers" />
      <div className="rounded-xl border border-border bg-card px-4 divide-y divide-border/60">
        {TIER_DEFS.map(({ key, label, desc }) => (
          <ToggleRow
            key={key}
            label={label}
            description={desc}
            checked={(preferences as Record<string, any>)[key] ?? true}
            onChange={(v) => updatePreferences({ [key]: v })}
            disabled={preferences.global_mute}
          />
        ))}
      </div>

      {/* ── All alert categories ── */}
      <SectionHeader icon={Trophy} title="Alert Types" />
      <div className="rounded-xl border border-border bg-card px-4 divide-y divide-border/60">
        {CATEGORY_DEFS.map(({ id, label, description }) => (
          <ToggleRow
            key={id}
            label={label}
            description={description}
            checked={preferences.enabled_categories.includes(id)}
            onChange={() => toggleCategory(id)}
            disabled={preferences.global_mute}
          />
        ))}
      </div>

      {/* ── Default reminder offsets — full 7-step ladder ── */}
      <SectionHeader icon={Clock} title="Default Reminder Timing" />
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground mb-3">
          When you set a reminder on a match, alerts fire at these times before kick-off. Select as many as you like.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {OFFSET_DEFS.map(({ value, label }) => {
            const active = preferences.default_reminder_offsets.includes(value)
            return (
              <button
                key={value}
                onClick={() => toggleOffset(value)}
                aria-pressed={active}
                className={[
                  "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition-colors",
                  active
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground",
                ].join(" ")}
              >
                {active && <Check className="h-3.5 w-3.5 shrink-0" />}
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Optional channels (commercial — explicit opt-in) ── */}
      <SectionHeader icon={Newspaper} title="Other Alerts" />
      <div className="rounded-xl border border-border bg-card px-4 divide-y divide-border/60">
        <ToggleRow
          label="Breaking news"
          description="Major transfers, injuries, and managerial changes"
          checked={preferences.allow_breaking_news}
          onChange={(v) => updatePreferences({ allow_breaking_news: v })}
        />
        <ToggleRow
          label="Transfer news"
          description="Rumours and confirmed signings for followed teams"
          checked={preferences.allow_transfer_news}
          onChange={(v) => updatePreferences({ allow_transfer_news: v })}
        />
        <ToggleRow
          label="Venue offers"
          description="Deals from saved venues near upcoming matches"
          checked={preferences.allow_venue_offers}
          onChange={(v) => updatePreferences({ allow_venue_offers: v })}
        />
      </div>

      {/* ── Quiet hours ── */}
      <SectionHeader icon={Moon} title="Quiet Hours" />
      <div className="rounded-xl border border-border bg-card px-4 divide-y divide-border/60">
        <ToggleRow
          label="Enable quiet hours"
          description="Suppress non-critical push notifications during these hours. Tier 1 alerts (goals, breaking news) still come through."
          checked={preferences.quiet_hours_enabled}
          onChange={(v) => updatePreferences({ quiet_hours_enabled: v })}
        />
        {preferences.quiet_hours_enabled && (
          <div className="py-3 flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">From</label>
              <input
                type="time"
                value={preferences.quiet_hours_start}
                onChange={(e) => updatePreferences({ quiet_hours_start: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Until</label>
              <input
                type="time"
                value={preferences.quiet_hours_end}
                onChange={(e) => updatePreferences({ quiet_hours_end: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Active subscriptions ── */}
      {subscriptions.length > 0 && (
        <>
          <SectionHeader icon={Bell} title="Active Alert Subscriptions" />
          <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden">
            {Object.entries(entityGroups).map(([type, subs]) =>
              subs.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {sub.entity_name || sub.entity_id}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {type === "event" ? "Match reminder" : type}
                      {sub.reminder_offsets?.length
                        ? ` · ${sub.reminder_offsets.join(", ")} before`
                        : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => { triggerHaptic("selection"); unsubscribe(sub.entity_type, sub.entity_id) }}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    aria-label={`Remove ${sub.entity_name ?? sub.entity_id} subscription`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}

    </div>
  )
}
