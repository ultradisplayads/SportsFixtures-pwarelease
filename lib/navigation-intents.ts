// lib/navigation-intents.ts
// Section 10 — Canonical navigation intent barrel.
// Re-exports all intent builders from lib/deep-links.ts under their canonical names.
// New code imports from here; lib/deep-links.ts remains the implementation file.

export {
  buildDeepLinkIntent,
  hrefToDeepLinkIntent,
  pushPayloadToIntent,
  externalOpenToIntent,
  intentHref,
  buildPushPayload,
} from "@/lib/deep-links"
