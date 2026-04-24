/**
 * Google Discover eligibility rules.
 * Every Discover-targeted page must pass these checks before being indexed.
 */

export const DISCOVER_RULES = {
  requireLargeImage: true,
  minOgImageWidth: 1200,
  minOgImageHeight: 630,
  allowLargePreview: true,
  requireClearHeadline: true,
  forbidClickbait: true,
  requireVisibleDateOnNews: true,
}

export type DiscoverCheck = {
  hasLargeImage: boolean
  hasVisibleDate: boolean
  hasClearHeadline: boolean
  isArticleLike: boolean
}

export function passesDiscoverChecks(check: DiscoverCheck): boolean {
  if (!check.hasLargeImage) return false
  if (check.isArticleLike && !check.hasVisibleDate) return false
  if (!check.hasClearHeadline) return false
  return true
}
