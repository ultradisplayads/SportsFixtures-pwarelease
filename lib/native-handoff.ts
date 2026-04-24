// Section 10 — Native Handoff Boundary Registry
// Documents every browser-only feature that will need a platform adapter
// when iOS/Android shells are introduced.
//
// Rules:
// - This is not user-facing — it is a dev/handoff reference
// - Each boundary must have: id, label, browserApi, location, nativeAdapterNeeded, abstracted
// - "abstracted: true" means a hook/helper already wraps the browser API
//   so native shells can swap the implementation without touching pages/components
// - "abstracted: false" means there is still direct browser API usage that
//   needs wrapping before native handoff

import type { HandoffBoundary } from "@/types/native-handoff"

// ---------------------------------------------------------------------------
// Browser-only feature isolation map
// ---------------------------------------------------------------------------

export const HANDOFF_BOUNDARIES: HandoffBoundary[] = [
  {
    id: "install_prompt",
    label: "PWA Install Prompt",
    browserApi: "BeforeInstallPromptEvent",
    location: "hooks/use-install-prompt.ts + components/pwa/install-banner.tsx",
    nativeAdapterNeeded:
      "Native shells handle install differently (App Store / Play Store). " +
      "The hook should return installState='unsupported' for native shells " +
      "or be replaced by a native store deep-link CTA.",
    abstracted: true,
  },
  {
    id: "service_worker",
    label: "Service Worker Registration",
    browserApi: "navigator.serviceWorker",
    location: "components/service-worker-registration.tsx",
    nativeAdapterNeeded:
      "Native shells manage their own update cycle. " +
      "ServiceWorkerRegistration should be gated and not mounted by native wrappers.",
    abstracted: true,
  },
  {
    id: "browser_push",
    label: "Browser Push Notifications",
    browserApi: "PushManager + Notification API",
    location:
      "public/sw.js (push/notificationclick handlers) + components/notification-provider.tsx",
    nativeAdapterNeeded:
      "Native push (APNs / FCM) replaces browser PushManager. " +
      "The normalized NormalizedPushPayload + pushPayloadToIntent() contract " +
      "must remain compatible so the same payload shape works for both.",
    abstracted: true,
  },
  {
    id: "online_offline",
    label: "Network Online/Offline Detection",
    browserApi: "navigator.onLine + window online/offline events",
    location: "hooks/use-platform-status.ts + lib/pwa-manager.ts",
    nativeAdapterNeeded:
      "Native shells provide reachability callbacks. " +
      "usePlatformStatus must be updated to accept an injected network state " +
      "or read from a native bridge event.",
    abstracted: true,
  },
  {
    id: "display_mode",
    label: "Standalone / Installed Display Mode",
    browserApi: "window.matchMedia('(display-mode: standalone)')",
    location: "lib/pwa.ts deriveStandaloneMode() + hooks/use-platform-status.ts",
    nativeAdapterNeeded:
      "Native shells are always in 'standalone' mode. " +
      "deriveStandaloneMode() should return true unconditionally in native context, " +
      "or usePlatformTarget should inject isStandalone=true.",
    abstracted: true,
  },
  {
    id: "geolocation",
    label: "Browser Geolocation",
    browserApi: "navigator.geolocation",
    location: "components/location-provider.tsx",
    nativeAdapterNeeded:
      "Native shells use platform location APIs with richer permission flows. " +
      "LocationProvider should accept an optional location injection prop " +
      "so native shells can bypass the browser geolocation prompt entirely.",
    abstracted: false,
  },
  {
    id: "local_storage",
    label: "localStorage for Preferences/Session",
    browserApi: "window.localStorage",
    location:
      "lib/pwa-manager.ts (fixtures cache) + hooks/use-install-prompt.ts (dismissal) + " +
      "components/location-provider.tsx (cached location)",
    nativeAdapterNeeded:
      "Native shells use AsyncStorage or equivalent. " +
      "These localStorage calls should eventually be wrapped in a platform storage adapter " +
      "but are low-risk for initial native handoff.",
    abstracted: false,
  },
  {
    id: "web_share",
    label: "Web Share API",
    browserApi: "navigator.share",
    location: "Not yet implemented — future share surfaces",
    nativeAdapterNeeded:
      "Native shells use UIActivityViewController (iOS) / Intent.ACTION_SEND (Android). " +
      "Any share button must go through ExternalLinkGuard or a dedicated shareIntent() " +
      "helper so the native shell can intercept.",
    abstracted: false,
  },
  {
    id: "external_links",
    label: "External Link Handling",
    browserApi: "anchor target='_blank'",
    location: "components/platform/external-link-guard.tsx",
    nativeAdapterNeeded:
      "Native shells must decide: in-app browser (SFSafariViewController / Chrome Custom Tabs) " +
      "or system browser. ExternalLinkGuard is already the abstraction point — " +
      "native shells override its behavior, not every individual link.",
    abstracted: true,
  },
]

// ---------------------------------------------------------------------------
// Session/auth assumptions for native handoff
// ---------------------------------------------------------------------------

export const SESSION_ASSUMPTIONS = {
  /**
   * Auth is device-token-based (anonymous) or JWT-based (signed-in).
   * Native shells must pass the same JWT/device-token in the same request
   * headers that the PWA uses — no browser-cookie-only auth.
   */
  authStrategy: "jwt_or_device_token" as const,

  /**
   * Account mode ("anonymous" | "signed_in") is always explicit in the
   * AccountOverviewResponse and in the entitlements contract.
   * Native shells can read this directly.
   */
  accountModeExplicit: true,

  /**
   * Entitlements are always derived server-side via /api/entitlements.
   * Native shells call the same endpoint with the same auth headers.
   */
  entitlementsContractDriven: true,

  /**
   * No critical signed-in state is stored only in browser localStorage.
   * The JWT lives in an HTTP-only cookie managed by the auth flow.
   */
  sessionStorageType: "http_only_cookie" as const,
}

// ---------------------------------------------------------------------------
// Route integrity for native handoff
// ---------------------------------------------------------------------------

/** All major route families that must remain stable for native deep-link opens. */
export const NATIVE_HANDOFF_ROUTES = [
  { pattern: "/",                 kind: "home",          stable: true },
  { pattern: "/match/:id",        kind: "match",         stable: true },
  { pattern: "/competition/:id",  kind: "competition",   stable: true },
  { pattern: "/team/:id",         kind: "team",          stable: true },
  { pattern: "/venues/:id",       kind: "venue",         stable: true },
  { pattern: "/news/:slugOrId",   kind: "news",          stable: true },
  { pattern: "/profile",          kind: "profile",       stable: true },
  { pattern: "/premium",          kind: "premium",       stable: true },
  { pattern: "/settings",         kind: "settings",      stable: true },
  { pattern: "/notifications",    kind: "notifications", stable: true },
] as const
