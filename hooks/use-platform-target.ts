"use client"

// Section 10 — Platform Target Hook
// Normalized sense of which shell the app is currently running under.
//
// Rules:
// - Components must NOT directly read matchMedia or navigator.standalone
// - Native shells can later inject a PlatformTarget override via context
//   without changing any page or component code

import { useEffect, useMemo, useState } from "react"
import { readBrowserCapabilities } from "@/lib/platform-capabilities"
import type { PlatformTarget, PlatformCapabilityMatrix } from "@/types/native-handoff"

export type UsePlatformTargetResult = {
  target: PlatformTarget
  capabilities: PlatformCapabilityMatrix
  isNativeShell: boolean
  isStandalone: boolean
}

/** Derives the platform target and capability matrix from browser signals.
 *  Returns stable "web" defaults during SSR so there is no hydration mismatch.
 *  Native shells will later override `target` by injecting a value via context
 *  or a global flag rather than changing this hook's internal logic.
 */
export function usePlatformTarget(): UsePlatformTargetResult {
  // Default to "web" during SSR and initial render to avoid hydration mismatch
  const [capabilities, setCapabilities] = useState<PlatformCapabilityMatrix>({
    installPrompt: false,
    browserPush: false,
    nativePushReady: false,
    shareIntentReady: false,
    deepLinkReady: true,
    standaloneShellReady: false,
  })

  useEffect(() => {
    setCapabilities(readBrowserCapabilities())
  }, [])

  const target = useMemo<PlatformTarget>(() => {
    // Future: check for injected native shell flag
    // e.g. (window as any).__SF_NATIVE_TARGET === "ios_shell"
    if (typeof window !== "undefined") {
      const nativeTarget = (window as any).__SF_NATIVE_TARGET as PlatformTarget | undefined
      if (nativeTarget === "ios_shell" || nativeTarget === "android_shell") {
        return nativeTarget
      }
    }

    return capabilities.standaloneShellReady ? "pwa" : "web"
  }, [capabilities.standaloneShellReady])

  return {
    target,
    capabilities,
    isNativeShell: target === "ios_shell" || target === "android_shell",
    isStandalone: capabilities.standaloneShellReady,
  }
}
