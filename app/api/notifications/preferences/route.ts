import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import type { NotificationPreferenceProfile } from "@/types/notifications"
import { buildDefaultNotificationPrefs } from "@/lib/alerts"

const sql = neon(process.env.DATABASE_URL!)

// Device token from request headers or query params
function getDeviceToken(req: NextRequest): string | null {
  return (
    req.headers.get("x-device-token") ||
    req.nextUrl.searchParams.get("deviceToken") ||
    null
  )
}

// ── GET — fetch or create prefs for this device ───────────────────────────────

export async function GET(req: NextRequest) {
  const deviceToken = getDeviceToken(req)

  if (deviceToken) {
    try {
      const rows = await sql`
        SELECT * FROM notification_preferences
        WHERE device_token = ${deviceToken}
        LIMIT 1
      `
      if (rows.length > 0) {
        return NextResponse.json(dbRowToProfile(rows[0]))
      }
    } catch {
      // table may not exist yet — fall through to defaults
    }
  }

  // Return defaults built from browser timezone if sent
  const timezone = req.nextUrl.searchParams.get("timezone") || "UTC"
  return NextResponse.json(buildDefaultNotificationPrefs(timezone))
}

// ── PATCH — save / merge prefs ────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const deviceToken = getDeviceToken(req)
  const patch: Partial<NotificationPreferenceProfile> = await req.json()

  if (!deviceToken) {
    // No device token — just echo back what was sent merged with defaults
    const merged = { ...buildDefaultNotificationPrefs(), ...patch }
    return NextResponse.json(merged)
  }

  try {
    // Upsert notification_preferences row
    const rows = await sql`
      INSERT INTO notification_preferences (
        device_token,
        push_enabled,
        in_app_enabled,
        global_mute,
        quiet_hours_enabled,
        quiet_hours_start,
        quiet_hours_end,
        timezone,
        default_reminder_offsets,
        enabled_categories,
        disabled_categories,
        tier1_enabled,
        tier2_enabled,
        tier3_enabled,
        allow_breaking_news,
        allow_venue_offers,
        allow_transfer_news,
        updated_at
      ) VALUES (
        ${deviceToken},
        ${patch.pushEnabled ?? false},
        ${patch.inAppEnabled ?? true},
        ${patch.globalMute ?? false},
        ${patch.quietHoursEnabled ?? false},
        ${patch.quietHoursStart ?? "22:00"},
        ${patch.quietHoursEnd ?? "08:00"},
        ${patch.timezone ?? "UTC"},
        ${JSON.stringify(patch.defaultReminderOffsets ?? ["1h","15m"])},
        ${JSON.stringify(patch.enabledCategories ?? [])},
        ${JSON.stringify(patch.disabledCategories ?? [])},
        ${patch.tierEnabled?.tier1 ?? true},
        ${patch.tierEnabled?.tier2 ?? true},
        ${patch.tierEnabled?.tier3 ?? false},
        ${patch.allowBreakingNews ?? false},
        ${patch.allowVenueOffers ?? false},
        ${patch.allowTransferNews ?? false},
        NOW()
      )
      ON CONFLICT (device_token) DO UPDATE SET
        push_enabled              = COALESCE(EXCLUDED.push_enabled, notification_preferences.push_enabled),
        in_app_enabled            = COALESCE(EXCLUDED.in_app_enabled, notification_preferences.in_app_enabled),
        global_mute               = COALESCE(EXCLUDED.global_mute, notification_preferences.global_mute),
        quiet_hours_enabled       = COALESCE(EXCLUDED.quiet_hours_enabled, notification_preferences.quiet_hours_enabled),
        quiet_hours_start         = COALESCE(EXCLUDED.quiet_hours_start, notification_preferences.quiet_hours_start),
        quiet_hours_end           = COALESCE(EXCLUDED.quiet_hours_end, notification_preferences.quiet_hours_end),
        timezone                  = COALESCE(EXCLUDED.timezone, notification_preferences.timezone),
        default_reminder_offsets  = COALESCE(EXCLUDED.default_reminder_offsets, notification_preferences.default_reminder_offsets),
        enabled_categories        = COALESCE(EXCLUDED.enabled_categories, notification_preferences.enabled_categories),
        disabled_categories       = COALESCE(EXCLUDED.disabled_categories, notification_preferences.disabled_categories),
        tier1_enabled             = COALESCE(EXCLUDED.tier1_enabled, notification_preferences.tier1_enabled),
        tier2_enabled             = COALESCE(EXCLUDED.tier2_enabled, notification_preferences.tier2_enabled),
        tier3_enabled             = COALESCE(EXCLUDED.tier3_enabled, notification_preferences.tier3_enabled),
        allow_breaking_news       = COALESCE(EXCLUDED.allow_breaking_news, notification_preferences.allow_breaking_news),
        allow_venue_offers        = COALESCE(EXCLUDED.allow_venue_offers, notification_preferences.allow_venue_offers),
        allow_transfer_news       = COALESCE(EXCLUDED.allow_transfer_news, notification_preferences.allow_transfer_news),
        updated_at                = NOW()
      RETURNING *
    `
    return NextResponse.json(dbRowToProfile(rows[0]))
  } catch (err) {
    // DB not yet migrated — return the patch merged with defaults
    console.error("[notifications/preferences]", err)
    const merged = { ...buildDefaultNotificationPrefs(), ...patch }
    return NextResponse.json(merged)
  }
}

// ── DB row → domain type ──────────────────────────────────────────────────────

function dbRowToProfile(row: any): NotificationPreferenceProfile {
  const parseArray = (v: any): string[] => {
    if (!v) return []
    if (Array.isArray(v)) return v
    try { return JSON.parse(v) } catch { return [] }
  }

  return {
    pushEnabled:            !!row.push_enabled,
    inAppEnabled:           row.in_app_enabled !== false,
    globalMute:             !!row.global_mute,
    quietHoursEnabled:      !!row.quiet_hours_enabled,
    quietHoursStart:        row.quiet_hours_start || "22:00",
    quietHoursEnd:          row.quiet_hours_end || "08:00",
    timezone:               row.timezone || "UTC",
    defaultReminderOffsets: parseArray(row.default_reminder_offsets) as any,
    enabledCategories:      parseArray(row.enabled_categories) as any,
    disabledCategories:     parseArray(row.disabled_categories) as any,
    tierEnabled: {
      tier1: row.tier1_enabled !== false,
      tier2: row.tier2_enabled !== false,
      tier3: !!row.tier3_enabled,
    },
    allowBreakingNews:  !!row.allow_breaking_news,
    allowVenueOffers:   !!row.allow_venue_offers,
    allowTransferNews:  !!row.allow_transfer_news,
    updatedAt:          row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  }
}
