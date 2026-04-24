"use client"

// components/assets/smart-logo.tsx
// Section 08.E — Pre-configured SmartImage for competition / league logos.
//
// Accepts either:
//   a) asset: NormalizedAssetSet (preferred — built by normalizeCompetitionLogo)
//   b) raw provider record (via `raw`) — normalizeCompetitionLogo() is applied
//   c) raw src + optional candidates[] (legacy)

import { SmartImage } from "@/components/assets/smart-image"
import { normalizeCompetitionLogo } from "@/lib/asset-normalization"
import type { NormalizedAssetSet, AssetSize } from "@/types/assets"

interface SmartLogoProps {
  /** Competition/league name — used as alt text and fallback initials. */
  name: string
  /** Preferred: pre-normalized asset set produced by normalizeCompetitionLogo(). */
  asset?: NormalizedAssetSet | null
  /** Raw provider record — normalizeCompetitionLogo() will pick the best field. */
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

export function SmartLogo({
  name,
  asset,
  raw,
  src,
  candidates = [],
  size = "md",
  className,
  width,
  height,
}: SmartLogoProps) {
  // Priority: explicit asset set > raw normalization > raw src props
  const resolvedAsset: NormalizedAssetSet | null =
    asset ??
    (raw ? normalizeCompetitionLogo(raw, name) : null)

  if (resolvedAsset) {
    return (
      <SmartImage
        asset={resolvedAsset}
        alt={name}
        size={size}
        className={className}
        width={width}
        height={height}
        fallbackShape="badge"
      />
    )
  }

  return (
    <SmartImage
      kind="competition_logo"
      src={src}
      candidates={candidates}
      fallbackLabel={name}
      alt={name}
      size={size}
      className={className}
      width={width}
      height={height}
      fallbackShape="badge"
    />
  )
}
