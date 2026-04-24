// Section 10 — Native App Handoff Types
// Single canonical source for all handoff-related domain types.
// These types are shared between the PWA layer now and native shell adapters later.

// ---------------------------------------------------------------------------
// Platform target
// ---------------------------------------------------------------------------

/** Which shell is the app currently running under.
 *  "web"            — standard browser tab
 *  "pwa"            — installed / standalone display mode
 *  "ios_shell"      — future iOS WKWebView / Capacitor wrapper
 *  "android_shell"  — future Android WebView / Capacitor wrapper
 */
export type PlatformTarget = "web" | "pwa" | "ios_shell" | "android_shell"

// ---------------------------------------------------------------------------
// Deep-link intent
// ---------------------------------------------------------------------------

/** All navigable destination kinds the app supports.
 *  This list must stay in sync with VALID_ROUTE_PREFIXES in types/pwa.ts
 *  and the switch in lib/deep-links.ts.
 */
export type DeepLinkKind =
  | "home"
  | "match"
  | "competition"
  | "team"
  | "venue"
  | "news"
  | "profile"
  | "premium"
  | "settings"
  | "notifications"

/** A fully resolved, validated deep-link intent.
 *  Every push open, external open, and in-app navigation should resolve to this.
 */
export type DeepLinkIntent = {
  kind: DeepLinkKind
  href: string
  entityId?: string | null
  valid: boolean
  fallbackHref?: string | null
}

// ---------------------------------------------------------------------------
// Push open intent
// ---------------------------------------------------------------------------

/** The normalized structure extracted from a push notification's data payload.
 *  Browser SW and future native shell both consume this same shape.
 */
export type PushOpenIntent = {
  href: string
  kind: DeepLinkKind
  entityId?: string | null
  source: "push"
}

// ---------------------------------------------------------------------------
// External open intent
// ---------------------------------------------------------------------------

/** Represents an attempt to open an external or share-target URL.
 *  "external"     — raw https:// URL from outside the app
 *  "share_target" — URL delivered via the Web Share Target API
 */
export type ExternalOpenIntent = {
  href: string
  source: "external" | "share_target"
  valid: boolean
  fallbackHref?: string | null
}

// ---------------------------------------------------------------------------
// Platform capability matrix
// ---------------------------------------------------------------------------

/** A point-in-time snapshot of which platform capabilities are available.
 *  Components and hooks must read from this rather than directly testing
 *  navigator.* APIs so native shells can later override cleanly.
 */
export type PlatformCapabilityMatrix = {
  /** BeforeInstallPromptEvent is available (Chrome/Edge desktop+Android) */
  installPrompt: boolean
  /** ServiceWorker + PushManager are both available */
  browserPush: boolean
  /** Placeholder — will be true when native push SDK is injected */
  nativePushReady: boolean
  /** navigator.share is available or a native share bridge exists */
  shareIntentReady: boolean
  /** Deep-link routing contract is in place (always true in this codebase) */
  deepLinkReady: boolean
  /** App is currently running in standalone/installed display mode */
  standaloneShellReady: boolean
}

// ---------------------------------------------------------------------------
// Normalized push payload
// ---------------------------------------------------------------------------

/** The canonical push notification data payload shape.
 *  Both the browser SW and future native shell should produce/consume this.
 *  Raw provider payloads must be normalized to this before routing.
 */
export type NormalizedPushPayload = {
  title: string
  body?: string
  intent: {
    kind: DeepLinkKind
    href: string
    entityId?: string | null
    fallbackHref?: string | null
  }
  notificationId?: string
  category?: string
}

// ---------------------------------------------------------------------------
// Handoff boundary descriptor
// ---------------------------------------------------------------------------

/** Describes a single browser-only feature that will need a platform adapter
 *  when native shells are introduced.
 */
export type HandoffBoundary = {
  /** Short machine-friendly identifier */
  id: string
  /** Human-readable name */
  label: string
  /** Which browser/PWA API this currently relies on */
  browserApi: string
  /** Where in the codebase the boundary lives */
  location: string
  /** What the native adapter will need to provide */
  nativeAdapterNeeded: string
  /** Whether this boundary is already behind an abstraction hook/helper */
  abstracted: boolean
}
