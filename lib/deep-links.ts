// Section 10 — Deep Link Contract
// Pure functions — no React imports, safe in SW context and server code.
//
// Rules:
// - Every navigable destination must go through buildDeepLinkIntent()
// - Push payloads must carry an intent object — not a raw URL alone
// - Native wrappers will later map app opens through the same functions
// - Route changes only need updating in one place (the switch below)

import type {
  DeepLinkIntent,
  DeepLinkKind,
  PushOpenIntent,
  ExternalOpenIntent,
  NormalizedPushPayload,
} from "@/types/native-handoff"

// ---------------------------------------------------------------------------
// Core intent builder
// ---------------------------------------------------------------------------

/**
 * Builds a fully resolved, validated DeepLinkIntent for any destination.
 * This is the single place to update when routes change.
 */
export function buildDeepLinkIntent(input: {
  kind: DeepLinkKind
  entityId?: string | null
  slug?: string | null
}): DeepLinkIntent {
  const { kind, entityId, slug } = input

  switch (kind) {
    case "home":
      return { kind, href: "/", valid: true, fallbackHref: "/" }

    case "match":
      return {
        kind,
        href: entityId ? `/match/${entityId}` : "/",
        entityId: entityId ?? null,
        valid: Boolean(entityId),
        fallbackHref: "/",
      }

    case "competition":
      return {
        kind,
        href: entityId ? `/competition/${entityId}` : "/browse",
        entityId: entityId ?? null,
        valid: true,
        fallbackHref: "/browse",
      }

    case "team":
      return {
        kind,
        href: entityId ? `/team/${entityId}` : "/browse",
        entityId: entityId ?? null,
        valid: true,
        fallbackHref: "/browse",
      }

    case "venue":
      return {
        kind,
        href: entityId ? `/venues/${entityId}` : "/venues",
        entityId: entityId ?? null,
        valid: true,
        fallbackHref: "/venues",
      }

    case "news":
      return {
        kind,
        href: slug ? `/news/${slug}` : entityId ? `/news/${entityId}` : "/news",
        entityId: slug ?? entityId ?? null,
        valid: true,
        fallbackHref: "/news",
      }

    case "profile":
      return { kind, href: "/profile", valid: true, fallbackHref: "/profile" }

    case "premium":
      return { kind, href: "/premium", valid: true, fallbackHref: "/premium" }

    case "settings":
      return { kind, href: "/settings", valid: true, fallbackHref: "/settings" }

    case "notifications":
      return { kind, href: "/notifications", valid: true, fallbackHref: "/notifications" }
  }
}

// ---------------------------------------------------------------------------
// Intent resolution from href string
// ---------------------------------------------------------------------------

/** All known route-to-kind mappings in priority order.
 *  Used to convert a raw href string back into a typed intent.
 */
const HREF_KIND_MAP: Array<{ prefix: string; kind: DeepLinkKind }> = [
  { prefix: "/match/",         kind: "match" },
  { prefix: "/competition/",   kind: "competition" },
  { prefix: "/team/",          kind: "team" },
  { prefix: "/venues/",        kind: "venue" },
  { prefix: "/venues",         kind: "venue" },
  { prefix: "/news/",          kind: "news" },
  { prefix: "/news",           kind: "news" },
  { prefix: "/profile",        kind: "profile" },
  { prefix: "/premium",        kind: "premium" },
  { prefix: "/settings",       kind: "settings" },
  { prefix: "/notifications",  kind: "notifications" },
]

/**
 * Resolves a raw href string into a DeepLinkIntent.
 * Extracts the entityId where the route family uses one.
 * Falls back to "home" if the href cannot be classified.
 */
export function hrefToDeepLinkIntent(href: string): DeepLinkIntent {
  if (typeof href !== "string" || !href.startsWith("/")) {
    return buildDeepLinkIntent({ kind: "home" })
  }

  for (const { prefix, kind } of HREF_KIND_MAP) {
    if (href === prefix || href.startsWith(prefix)) {
      const entityId = href.length > prefix.length
        ? href.slice(prefix.length).split("?")[0].split("#")[0] || null
        : null
      return buildDeepLinkIntent({ kind, entityId })
    }
  }

  // Root "/" or unrecognized — treat as home
  return buildDeepLinkIntent({ kind: "home" })
}

// ---------------------------------------------------------------------------
// Push payload → PushOpenIntent
// ---------------------------------------------------------------------------

/**
 * Extracts a normalized PushOpenIntent from a raw push notification data
 * payload. Supports both legacy (url/href) and new (intent.*) payload shapes.
 *
 * Browser SW and native shell both call this same function.
 */
export function pushPayloadToIntent(
  data: Record<string, any> | null | undefined,
): PushOpenIntent {
  if (!data) {
    return { href: "/", kind: "home", entityId: null, source: "push" }
  }

  // New normalized payload: data.intent.kind + data.intent.href
  if (data.intent && typeof data.intent.kind === "string") {
    const intent = buildDeepLinkIntent({
      kind: data.intent.kind as DeepLinkKind,
      entityId: data.intent.entityId ?? null,
      slug: data.intent.entityId ?? null,
    })
    return {
      href: intent.valid ? intent.href : (intent.fallbackHref ?? "/"),
      kind: intent.kind,
      entityId: intent.entityId ?? null,
      source: "push",
    }
  }

  // Legacy payload: data.url / data.href / data.link / data.action.url
  const rawHref: string =
    data.url || data.href || data.link || data.action?.url || "/"

  const intent = hrefToDeepLinkIntent(String(rawHref))
  return {
    href: intent.valid ? intent.href : (intent.fallbackHref ?? "/"),
    kind: intent.kind,
    entityId: intent.entityId ?? null,
    source: "push",
  }
}

// ---------------------------------------------------------------------------
// External / share-target URL → ExternalOpenIntent
// ---------------------------------------------------------------------------

const INTERNAL_ORIGIN_RE = /^https?:\/\/(localhost|[\w.-]+\.sportsfixtures\.(net|app|io))/i

/**
 * Classifies an incoming URL as external or potentially internal.
 * External URLs are safe to open in a new tab / in-app browser.
 * Same-origin URLs should be treated as deep links via hrefToDeepLinkIntent.
 */
export function externalOpenToIntent(
  href: string,
  source: ExternalOpenIntent["source"] = "external",
): ExternalOpenIntent {
  if (typeof href !== "string" || !href.trim()) {
    return { href, source, valid: false, fallbackHref: "/" }
  }

  // Absolute but same-origin (e.g. share-target) — treat as safe
  if (INTERNAL_ORIGIN_RE.test(href)) {
    try {
      const url = new URL(href)
      const intent = hrefToDeepLinkIntent(url.pathname + url.search + url.hash)
      return {
        href: intent.href,
        source,
        valid: intent.valid,
        fallbackHref: intent.fallbackHref ?? "/",
      }
    } catch {
      return { href, source, valid: false, fallbackHref: "/" }
    }
  }

  // Genuine external URL — valid as long as it starts with https://
  const isHttps = href.startsWith("https://")
  return {
    href,
    source,
    valid: isHttps,
    fallbackHref: isHttps ? null : "/",
  }
}

// ---------------------------------------------------------------------------
// Safe href extractor
// ---------------------------------------------------------------------------

/** Returns the href to navigate to from any intent, always falling back safely. */
export function intentHref(
  intent: DeepLinkIntent | PushOpenIntent | ExternalOpenIntent,
): string {
  if ("valid" in intent) {
    return intent.valid ? intent.href : (intent.fallbackHref ?? "/")
  }
  return intent.href ?? "/"
}

// ---------------------------------------------------------------------------
// NormalizedPushPayload builder (for outgoing push construction)
// ---------------------------------------------------------------------------

/** Constructs a NormalizedPushPayload for a given intent.
 *  Use this when building notification payloads server-side so the shape
 *  is consistent with what pushPayloadToIntent() expects to receive.
 */
export function buildPushPayload(
  title: string,
  intent: DeepLinkIntent,
  options?: { body?: string; notificationId?: string; category?: string },
): NormalizedPushPayload {
  return {
    title,
    body: options?.body,
    notificationId: options?.notificationId,
    category: options?.category,
    intent: {
      kind: intent.kind,
      href: intent.href,
      entityId: intent.entityId ?? null,
      fallbackHref: intent.fallbackHref ?? null,
    },
  }
}
