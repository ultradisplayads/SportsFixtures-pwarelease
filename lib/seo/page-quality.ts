/**
 * Page quality gate.
 * If a page fails these checks it should be served with noindex.
 *
 * Mandatory per spec §23 and §6.2:
 *   - has a summary (not placeholder)
 *   - has key facts
 *   - has a freshness / source block
 *   - has at least one related entity link
 *   - has no placeholder or demo content
 */

export type PageQualityArgs = {
  hasSummary: boolean
  hasKeyFacts: boolean
  hasFreshnessBlock: boolean
  hasRelatedLinks: boolean
  hasPlaceholderContent: boolean
}

export type PageQualityResult = {
  indexable: boolean
  failReasons: string[]
}

export function checkPageQuality(args: PageQualityArgs): PageQualityResult {
  const failReasons: string[] = []

  if (args.hasPlaceholderContent) failReasons.push("placeholder content present")
  if (!args.hasSummary) failReasons.push("missing summary block")
  if (!args.hasKeyFacts) failReasons.push("missing key facts")
  if (!args.hasFreshnessBlock) failReasons.push("missing freshness/source block")
  if (!args.hasRelatedLinks) failReasons.push("missing related entity links")

  return {
    indexable: failReasons.length === 0,
    failReasons,
  }
}

/** Convenience boolean shortcut */
export function isPageIndexable(args: PageQualityArgs): boolean {
  return checkPageQuality(args).indexable
}

const PLACEHOLDER_STRINGS = [
  "lorem ipsum",
  "placeholder",
  "coming soon",
  "to be confirmed",
  "tbc",
  "n/a",
  "undefined",
  "null",
]

/**
 * Returns true if any of the provided strings look like placeholder content.
 * Accepts string | null | undefined values for convenience.
 */
export function hasPlaceholderContent(
  values: Array<string | null | undefined>,
): boolean {
  return values.some((v) => {
    if (!v || v.trim().length === 0) return false
    const lower = v.toLowerCase()
    return PLACEHOLDER_STRINGS.some((p) => lower.includes(p))
  })
}
