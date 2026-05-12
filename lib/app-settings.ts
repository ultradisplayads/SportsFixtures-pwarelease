/**
 * lib/app-settings.ts
 * Central store for user-controlled app-wide settings persisted to localStorage.
 * All settings default to false (off) unless the user explicitly enables them.
 */

export type AppSettings = {
  /** Quirk mascot + sport-ball pop-in animations. Default: off. */
  quirkyAnimations: boolean
  /** Fan mode (disco colour overlay). Mirrors disco_mode key. */
  fanMode: boolean
  /** Fan mode visual background intensity. */
  fanModeBackground: "dark" | "light"
}

const STORAGE_KEY = "sf_app_settings"

export const DEFAULT_SETTINGS: AppSettings = {
  quirkyAnimations: false,
  fanMode: false,
  fanModeBackground: "dark",
}

export function loadAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      // Migrate legacy disco_mode key so existing fans keep their preference
      const legacyFanMode = localStorage.getItem("disco_mode") === "true"
      return { ...DEFAULT_SETTINGS, fanMode: legacyFanMode }
    }
    const parsed = JSON.parse(raw)
    const fanModeBackground = parsed.fanModeBackground === "light" ? "light" : "dark"
    return { ...DEFAULT_SETTINGS, ...parsed, fanModeBackground }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveAppSettings(next: Partial<AppSettings>): AppSettings {
  const current = loadAppSettings()
  const merged: AppSettings = { ...current, ...next }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
    // Keep legacy disco_mode key in sync
    localStorage.setItem("disco_mode", String(merged.fanMode))
    window.dispatchEvent(new CustomEvent("sf:app-settings-change", { detail: merged }))
  } catch { /* ignore */ }
  return merged
}
