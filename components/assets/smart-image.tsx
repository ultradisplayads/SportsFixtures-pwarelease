"use client"

// components/assets/smart-image.tsx
// Section 08 — Centralized image component with multi-candidate retry.
//
// Accepts either:
//   a) a NormalizedAssetSet (preferred — produced by buildAssetSet / normalizeX())
//   b) raw src + candidates[] (legacy prop-driven path, still fully supported)
//
// Retry behaviour:
//   - Tries candidate[0], if onError → candidate[1], → candidate[2], etc.
//   - Only falls back to FallbackBadge/FallbackRect when ALL candidates fail
//   - Never leaves a broken browser image shell visible

import { useMemo, useState } from "react"
import type { NormalizedAssetSet, AssetKind, AssetSize } from "@/types/assets"
import { ASSET_SIZE_CLASS } from "@/types/assets"
import { resolveAsset } from "@/lib/assets"
import { FallbackBadge } from "@/components/assets/fallback-badge"
import { FallbackRect } from "@/components/assets/fallback-rect"

// ── Props ─────────────────────────────────────────────────────────────────

interface SmartImageAssetSetProps {
  /** Preferred: pass the full NormalizedAssetSet from a DTO. */
  asset: NormalizedAssetSet
  kind?: AssetKind
  src?: never
  candidates?: never
  fallbackLabel?: string | null
  alt: string
  size?: AssetSize
  className?: string
  width?: number
  height?: number
  fallbackShape?: "badge" | "rect"
  nativeFallback?: boolean
}

interface SmartImageRawProps {
  /** Legacy: pass raw src + optional candidate list. */
  asset?: never
  kind: AssetKind
  src?: string | null
  candidates?: Array<string | null | undefined>
  fallbackLabel?: string | null
  alt: string
  size?: AssetSize
  className?: string
  width?: number
  height?: number
  fallbackShape?: "badge" | "rect"
  nativeFallback?: boolean
}

type SmartImageProps = SmartImageAssetSetProps | SmartImageRawProps

// ── Component ─────────────────────────────────────────────────────────────

/**
 * SmartImage — renders the best available URL from an ordered candidate list.
 * On each onError, advances to the next candidate.
 * When all candidates are exhausted, renders FallbackBadge or FallbackRect.
 */
export function SmartImage({
  asset,
  kind,
  src,
  candidates = [],
  fallbackLabel,
  alt,
  size,
  className,
  width,
  height,
  fallbackShape = "badge",
  nativeFallback = false,
}: SmartImageProps) {
  // Build the ordered URL list from either path
  const urls = useMemo<string[]>(() => {
    if (asset) {
      // NormalizedAssetSet path — use the full candidate list
      return asset.candidates.map((c) => c.url)
    }
    // Raw prop path — resolve via resolveAsset for consistency
    const resolved = resolveAsset({
      kind: kind!,
      candidates: [src, ...candidates],
      fallbackLabel,
    })
    return resolved.candidatesTried
  }, [asset, kind, src, candidates, fallbackLabel])

  const effectiveFallbackLabel =
    fallbackLabel ?? asset?.fallbackLabel ?? alt

  const effectiveKind: AssetKind =
    kind ?? asset?.kind ?? "generic"

  // Track which candidate index we are currently on
  const [index, setIndex] = useState(0)

  // className wins over size token; size token wins over built-in default
  const sizeClass = size ? ASSET_SIZE_CLASS[size] : undefined
  const effectiveClass = className ?? sizeClass

  const current = urls[index] ?? null

  if (!current) {
    if (nativeFallback) return null
    return fallbackShape === "rect" ? (
      <FallbackRect label={effectiveFallbackLabel} className={effectiveClass} />
    ) : (
      <FallbackBadge label={effectiveFallbackLabel} className={effectiveClass} />
    )
  }

  return (
    <img
      src={current}
      alt={alt}
      className={effectiveClass}
      width={width}
      height={height}
      onError={() => {
        if (index < urls.length - 1) {
          setIndex((prev) => prev + 1)
        } else {
          // All candidates exhausted — push past the array to trigger fallback
          setIndex(urls.length)
        }
      }}
    />
  )
}
