// lib/home-module-state.ts
// Section 07.A — Normalized home-module runtime state resolver.
//
// This is the single place where control-plane module config and
// user-level module preferences are reconciled into a final
// visible/hidden decision for every homepage module.
//
// Rules:
// - A module is visible only when BOTH the control plane enables it AND
//   the user has not locally disabled it.
// - hiddenReason tells the operator/UI exactly why a module is hidden.
// - This resolver must never throw — it must always return a safe array.

export type HomeModuleRuntimeState = {
  key: string
  enabledByControlPlane: boolean
  enabledByUser: boolean
  visible: boolean
  /** Why the module is hidden. null when visible. */
  hiddenReason: "control_plane" | "user_pref" | null
}

export type ResolveHomeModuleInput = {
  /** Modules from the control plane (all — including disabled ones). */
  controlPlaneModules: Array<{ key: string; enabled: boolean; position: number }>
  /** User local preferences: key → true means user has NOT disabled it (or preference absent = default true). */
  userModulePrefs: Record<string, boolean>
}

/**
 * Resolves the runtime visibility state for every homepage module.
 *
 * Returns modules sorted by their control-plane position.
 * Modules that are not present in the control-plane list are not returned
 * (unknown keys are not visible by default).
 */
export function resolveHomeModuleRuntimeState(
  input: ResolveHomeModuleInput,
): HomeModuleRuntimeState[] {
  if (!input || !Array.isArray(input.controlPlaneModules)) return []

  const sorted = [...input.controlPlaneModules].sort((a, b) => a.position - b.position)

  return sorted.map((m) => {
    const userEnabled = input.userModulePrefs[m.key] ?? true
    const visible = m.enabled && userEnabled

    return {
      key: m.key,
      enabledByControlPlane: m.enabled,
      enabledByUser: userEnabled,
      visible,
      hiddenReason: visible
        ? null
        : m.enabled
          ? "user_pref"
          : "control_plane",
    } satisfies HomeModuleRuntimeState
  })
}

/**
 * Returns only the modules that should be visible (both CP-enabled and user-enabled).
 */
export function getVisibleModules(
  input: ResolveHomeModuleInput,
): HomeModuleRuntimeState[] {
  return resolveHomeModuleRuntimeState(input).filter((m) => m.visible)
}

/**
 * Returns a human-readable reason string for why a module is hidden.
 * Used in settings / admin UIs.
 */
export function getHiddenReasonLabel(reason: HomeModuleRuntimeState["hiddenReason"]): string {
  switch (reason) {
    case "control_plane":
      return "Disabled by operator config"
    case "user_pref":
      return "Hidden by you in Home Layout settings"
    default:
      return ""
  }
}
