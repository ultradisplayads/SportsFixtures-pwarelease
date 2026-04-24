// lib/navigation-targets.ts
// Section 07.C — Canonical route resolver for home CTAs.
//
// All home CTAs must resolve their href through this helper, not ad hoc strings.
// This prevents dead buttons when a page is renamed, moved, or not yet built.
//
// Rules:
// - resolveTvGuideHref must always return a real, existing route.
// - If the match-specific TV anchor exists, prefer it.
// - Otherwise fall back to the global /tv page (which exists).

/**
 * Resolves the canonical href for a TV Guide CTA.
 *
 * @param input.eventId - If provided, link to the match's TV tab.
 * @param input.fallbackMode - "global_tv" (default) links to /tv.
 */
export function resolveTvGuideHref(input?: {
  eventId?: string | null
  fallbackMode?: "global_tv" | "match_tv"
}): string {
  if (input?.eventId) return `/match/${input.eventId}#tv`
  return "/tv"
}

/**
 * Resolves the canonical href for the Venues / Find Bars CTA.
 */
export function resolveVenuesHref(input?: {
  eventId?: string | null
  sport?: string | null
}): string {
  if (input?.eventId) return `/venues?eventId=${input.eventId}`
  return "/venues"
}

/**
 * Resolves the canonical href for the Calendar / My Calendar CTA.
 * /calendar is a real, standalone page (see app/calendar/page.tsx).
 */
export function resolveCalendarHref(): string {
  return "/calendar"
}

/**
 * Resolves the canonical href for the Home Layout management surface.
 */
export function resolveHomeLayoutHref(): string {
  return "/settings/home-layout"
}
