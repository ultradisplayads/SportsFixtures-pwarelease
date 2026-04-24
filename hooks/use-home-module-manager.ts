"use client";

// hooks/use-home-module-manager.ts
// Section 07.B/E — Unified home module preference manager.
//
// Single authoritative hook for sf_home_modules localStorage.
// Both HomeModuleRenderer (visibility gating) and settings/home-layout
// (management UI) consume this hook so they share state and storage format.
//
// Storage schema: Array<{ id: string; enabled: boolean }>
// Key: "sf_home_modules" (shared with legacy personalized-home useHomeModules)
//
// Previously this hook used key "sf:home-module-prefs" with a map format —
// that caused a split-brain between the renderer and the settings page.

import { useCallback, useEffect, useMemo, useState } from "react";
import type { HomeModuleKey, HomeModuleRuntimeState } from "@/types/home-modules";

// Must match personalized-home.tsx and settings/home-layout/page.tsx
const STORAGE_KEY = "sf_home_modules";

export type ControlPlaneModuleInput = {
  key: HomeModuleKey;
  enabled: boolean;
  position?: number | null;
  titleOverride?: string | null;
  limit?: number | null;
};

type StoredPref = { id: string; enabled: boolean };

const DEFAULT_PREFS: StoredPref[] = [
  { id: "recommended", enabled: true },
  { id: "live",        enabled: true },
  { id: "fixtures",    enabled: true },
  { id: "news",        enabled: true },
  { id: "calendar",    enabled: true },
  { id: "venues",      enabled: true },
  { id: "leaderboard", enabled: false },
];

function loadPrefs(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    // Accept both legacy {id, label, enabled}[] and current {id, enabled}[]
    if (Array.isArray(parsed)) {
      return Object.fromEntries(
        parsed
          .filter((p): p is Record<string, unknown> => typeof p === "object" && p !== null && "id" in p)
          .map((p) => [String(p.id), Boolean(p.enabled ?? true)])
      );
    }
    // Accept the old map format { key: boolean } for migration
    if (typeof parsed === "object") return parsed as Record<string, boolean>;
    return {};
  } catch {
    return {};
  }
}

function savePrefs(prefMap: Record<string, boolean>, order: string[]): void {
  try {
    const arr: StoredPref[] = order.map((id) => ({ id, enabled: prefMap[id] ?? true }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {
    // ignore (private mode / storage full)
  }
}

function resolveRuntimeModules(
  controlPlaneModules: ControlPlaneModuleInput[],
  userPrefMap: Record<string, boolean>,
): HomeModuleRuntimeState[] {
  return [...controlPlaneModules]
    .sort((a, b) => (a.position ?? 999) - (b.position ?? 999))
    .map((m) => {
      const userEnabled = userPrefMap[m.key] ?? true;
      const visible = m.enabled && userEnabled;
      return {
        key: m.key,
        enabledByControlPlane: m.enabled,
        enabledByUser: userEnabled,
        visible,
        hiddenReason: visible ? null : m.enabled ? "user_pref" : "control_plane",
        titleOverride: m.titleOverride ?? null,
        position: m.position ?? null,
        limit: m.limit ?? null,
      } satisfies HomeModuleRuntimeState;
    });
}

export function useHomeModuleManager(
  controlPlaneModules: ControlPlaneModuleInput[] = [],
) {
  const [prefMap, setPrefMap] = useState<Record<string, boolean>>({});
  // Ordered key list (mirrors the order of prefs array stored on disk)
  const [order, setOrder] = useState<string[]>(() =>
    DEFAULT_PREFS.map((p) => p.id)
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadPrefs();
    setPrefMap(loaded);
    // Rebuild order from stored array (preserves user drag-reorder)
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const storedOrder = parsed
            .filter((p): p is Record<string, unknown> => typeof p === "object" && p !== null && "id" in p)
            .map((p) => String(p.id));
          if (storedOrder.length > 0) setOrder(storedOrder);
        }
      }
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  const setModuleEnabled = useCallback((key: string, enabled: boolean) => {
    setPrefMap((prev) => {
      const next = { ...prev, [key]: enabled };
      setOrder((ord) => {
        const finalOrder = ord.includes(key) ? ord : [...ord, key];
        savePrefs(next, finalOrder);
        return finalOrder;
      });
      return next;
    });
  }, []);

  const toggle = useCallback((key: string) => {
    setPrefMap((prev) => {
      const next = { ...prev, [key]: !(prev[key] ?? true) };
      setOrder((ord) => {
        const finalOrder = ord.includes(key) ? ord : [...ord, key];
        savePrefs(next, finalOrder);
        return finalOrder;
      });
      return next;
    });
  }, []);

  const reorder = useCallback((from: number, to: number) => {
    setOrder((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      setPrefMap((pm) => {
        savePrefs(pm, next);
        return pm;
      });
      return next;
    });
  }, []);

  const enable = useCallback((key: string) => {
    setModuleEnabled(key, true);
  }, [setModuleEnabled]);

  const resetModules = useCallback(() => {
    const defaultMap = Object.fromEntries(DEFAULT_PREFS.map((p) => [p.id, p.enabled]));
    const defaultOrder = DEFAULT_PREFS.map((p) => p.id);
    setPrefMap(defaultMap);
    setOrder(defaultOrder);
    savePrefs(defaultMap, defaultOrder);
  }, []);

  const runtimeModules: HomeModuleRuntimeState[] = useMemo(
    () => resolveRuntimeModules(controlPlaneModules, prefMap),
    [controlPlaneModules, prefMap],
  );

  // Simple disabled-key set for renderer fast-path (no CP modules provided)
  const disabledKeys = useMemo(
    () => new Set(Object.entries(prefMap).filter(([, v]) => !v).map(([k]) => k)),
    [prefMap],
  );

  return {
    hydrated,
    prefMap,
    order,
    disabledKeys,
    runtimeModules,
    setModuleEnabled,
    toggle,
    reorder,
    enable,
    resetModules,
  };
}
