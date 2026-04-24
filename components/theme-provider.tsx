"use client"

import type * as React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"

export type Theme = "light" | "dark" | "disco"

export const DISCO_COLORS = [
  { label: "Hot Pink",   hue: 330, sat: 0.28, primary: "oklch(0.65 0.28 330)" },
  { label: "Electric",   hue: 280, sat: 0.30, primary: "oklch(0.62 0.30 280)" },
  { label: "Cyan",       hue: 200, sat: 0.25, primary: "oklch(0.65 0.25 200)" },
  { label: "Lime",       hue: 135, sat: 0.28, primary: "oklch(0.65 0.28 135)" },
  { label: "Orange",     hue: 50,  sat: 0.26, primary: "oklch(0.68 0.26 50)"  },
  { label: "Red",        hue: 25,  sat: 0.28, primary: "oklch(0.60 0.28 25)"  },
] as const

export type DiscoColor = (typeof DISCO_COLORS)[number]

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "light" | "dark"
  discoColor: DiscoColor
  setDiscoColor: (c: DiscoColor) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light")
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light")
  const [discoColor, setDiscoColorState] = useState<DiscoColor>(DISCO_COLORS[0])

  // Restore persisted preferences
  useEffect(() => {
    // Migrate old "theme" key and "system" value
    const legacyKey = localStorage.getItem("theme")
    if (legacyKey) {
      localStorage.removeItem("theme")
      if (legacyKey !== "system") localStorage.setItem("sf-theme", legacyKey)
    }

    const savedTheme = localStorage.getItem("sf-theme") as Theme | null
    if (savedTheme && (["light", "dark", "disco"] as string[]).includes(savedTheme)) {
      setThemeState(savedTheme)
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setThemeState(prefersDark ? "dark" : "light")
    }
    const savedColor = localStorage.getItem("sf-disco-color")
    if (savedColor) {
      const found = DISCO_COLORS.find((c) => c.label === savedColor)
      if (found) setDiscoColorState(found)
    }
  }, [])

  const applyTheme = useCallback((t: Theme, color: DiscoColor) => {
    const root = document.documentElement
    root.classList.remove("dark", "disco")

    if (t === "dark") {
      root.classList.add("dark")
      setResolvedTheme("dark")
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#0a1f0a")
    } else if (t === "disco") {
      root.classList.add("dark", "disco")
      setResolvedTheme("dark")
      // Override primary hue dynamically
      root.style.setProperty("--disco-hue", String(color.hue))
      root.style.setProperty("--disco-sat", String(color.sat))
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#0a0010")
    } else {
      setResolvedTheme("light")
      root.style.removeProperty("--disco-hue")
      root.style.removeProperty("--disco-sat")
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#5cb827")
    }
  }, [])

  useEffect(() => {
    applyTheme(theme, discoColor)
  }, [theme, discoColor, applyTheme])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem("sf-theme", newTheme)
  }, [])

  const setDiscoColor = useCallback((c: DiscoColor) => {
    setDiscoColorState(c)
    localStorage.setItem("sf-disco-color", c.label)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, discoColor, setDiscoColor }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider")
  return context
}
