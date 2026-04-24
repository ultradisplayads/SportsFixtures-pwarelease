/**
 * lib/personalization-identity.ts
 *
 * Makes the current personalization identity mode explicit and stable.
 *
 * Current strategy:
 * ─────────────────
 *  - "anonymous-device": The default mode. A device UUID stored in
 *    localStorage is used as the DB key for all personalization data.
 *    Follows, preferences, and notification subscriptions are fully
 *    functional in this mode — they just can't roam across devices.
 *
 *  - "signed-in-account": Set when the user authenticates. In a future
 *    sprint, this triggers a merge of the anonymous device's favourites
 *    into the user account on the server, and subsequent API calls swap
 *    from using x-device-token to a user-scoped JWT.
 *
 * Merge strategy (documented, not yet fully implemented):
 * ────────────────────────────────────────────────────────
 *  "preserve-local-until-explicit-account-merge"
 *
 *  Anonymous data is never discarded implicitly. When a signed-in merge
 *  is triggered (e.g. via POST /api/favourites/merge), the device-token
 *  follows are union-merged into the account record. Local data remains
 *  the source of truth until a successful merge is confirmed by the API.
 *
 * No local personalization data should be discarded by this module.
 */

export type PersonalizationIdentityMode = "anonymous-device" | "signed-in-account"

const PERSONALIZATION_IDENTITY_KEY = "sf_personalization_identity_mode"

export function getPersonalizationIdentityMode(): PersonalizationIdentityMode {
  if (typeof window === "undefined") return "anonymous-device"
  const value = localStorage.getItem(PERSONALIZATION_IDENTITY_KEY)
  return value === "signed-in-account" ? "signed-in-account" : "anonymous-device"
}

export function setPersonalizationIdentityMode(mode: PersonalizationIdentityMode): void {
  if (typeof window === "undefined") return
  localStorage.setItem(PERSONALIZATION_IDENTITY_KEY, mode)
}

/**
 * Returns a descriptor of the current identity and persistence strategy.
 * Intended for debug panels and future account-merge UI.
 */
export function getPersonalizationStorageMeta() {
  return {
    identityMode: getPersonalizationIdentityMode(),
    supportsAnonymousPersistence: true,
    mergeStrategy: "preserve-local-until-explicit-account-merge",
    deviceTokenKey: "sf_device_token",
    note: "Anonymous device follows are stored in Neon keyed by device token. Signed-in merge is a future sprint item.",
  }
}

/**
 * Call this when a user successfully signs in.
 * Sets mode to signed-in-account; the caller is responsible for
 * triggering the actual server-side merge operation.
 */
export function onUserSignIn(): void {
  setPersonalizationIdentityMode("signed-in-account")
}

/**
 * Call this on sign-out. Reverts to anonymous-device mode.
 * Does NOT clear local follows — they remain for the device.
 */
export function onUserSignOut(): void {
  setPersonalizationIdentityMode("anonymous-device")
}
