"use client"

// components/assets/smart-flag.tsx
// Section 08.E — Pre-configured SmartImage for country flags.
//
// Accepts either:
//   a) asset: NormalizedAssetSet (preferred — built by normalizeCountryFlag)
//   b) raw provider record (via `raw`) — normalizeCountryFlag() is applied
//   c) raw src + optional candidates[] (legacy)

import { SmartImage } from "@/components/assets/smart-image"
import { normalizeCountryFlag } from "@/lib/asset-normalization"
import type { NormalizedAssetSet, AssetSize } from "@/types/assets"

interface SmartFlagProps {
  /** Country name — used as alt text and fallback initials (e.g. "TH"). */
  country: string
  /** Preferred: pre-normalized asset set produced by normalizeCountryFlag(). */
  asset?: NormalizedAssetSet | null
  /** Raw provider record — normalizeCountryFlag() will pick the best field. */
  raw?: Record<string, unknown> | null
  /** Pre-resolved primary URL — used instead of `raw` when available. */
  src?: string | null
  /** Additional candidate URLs tried after src. */
  candidates?: Array<string | null | undefined>
  size?: AssetSize
  className?: string
  width?: number
  height?: number
}

export function SmartFlag({
  country,
  asset,
  raw,
  src,
  candidates = [],
  size = "sm",
  className,
  width,
  height,
}: SmartFlagProps) {
  const resolvedAsset: NormalizedAssetSet | null =
    asset ??
    (raw ? normalizeCountryFlag(raw, country) : null)

  if (resolvedAsset) {
    return (
      <SmartImage
        asset={resolvedAsset}
        alt={`${country} flag`}
        size={size}
        className={className}
        width={width}
        height={height}
        fallbackShape="rect"
      />
    )
  }

  return (
    <SmartImage
      kind="country_flag"
      src={src}
      candidates={candidates}
      fallbackLabel={country}
      alt={`${country} flag`}
      size={size}
      className={className}
      width={width}
      height={height}
      fallbackShape="rect"
    />
  )
}
