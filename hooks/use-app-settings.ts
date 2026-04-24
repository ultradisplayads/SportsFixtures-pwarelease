"use client"

import { useState, useCallback, useEffect } from "react"
import {
  loadAppSettings,
  saveAppSettings,
  DEFAULT_SETTINGS,
  type AppSettings,
} from "@/lib/app-settings"
import { triggerHaptic } from "@/lib/haptic-feedback"

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)

  // Hydrate from localStorage once on the client
  useEffect(() => {
    setSettings(loadAppSettings())
  }, [])

  const toggle = useCallback(
    (key: keyof AppSettings) => {
      triggerHaptic("light")
      setSettings((prev) => {
        const next = saveAppSettings({ [key]: !prev[key] })
        return next
      })
    },
    [],
  )

  const set = useCallback(
    (key: keyof AppSettings, value: boolean) => {
      triggerHaptic("light")
      setSettings((_prev) => saveAppSettings({ [key]: value }))
    },
    [],
  )

  return { settings, toggle, set }
}
