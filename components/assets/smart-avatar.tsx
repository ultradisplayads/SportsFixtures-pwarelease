"use client"

// components/assets/smart-avatar.tsx
// Section 08.E — Pre-configured SmartImage for player avatars and team badges.
//
// Accepts either:
//   a) asset: NormalizedAssetSet (preferred — built by normalizePlayerAvatar/normalizeTeamBadge)
//   b) raw provider record (via `raw`) — variant determines which normalizer is used
//   c) raw src + optional candidates[] (legacy)

import { SmartImage } from "@/components/assets/smart-image"
import { normalizePlayerAvatar, normalizeTeamBadge } from "@/lib/asset-normalization"
import type { NormalizedAssetSet, AssetSize } from "@/types/assets"

type SmartAvatarVariant = "player" | "team"

interface SmartAvatarProps {
  /** Display name — used as alt text and fallback initials. */
  name: string
  /** Controls which normalization function is applied to `raw`. */
  variant?: SmartAvatarVariant
  /** Preferred: pre-normalized asset set. */
  asset?: NormalizedAssetSet | null
  /** Raw provider record — the matching normalizer picks the best field. */
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

export function SmartAvatar({
  name,
  variant = "player",
  asset,
  raw,
  src,
  candidates = [],
  size = "md",
  className,
  width,
  height,
}: SmartAvatarProps) {
  const resolvedAsset: NormalizedAssetSet | null =
    asset ??
    (raw
      ? variant === "team"
        ? normalizeTeamBadge(raw, name)
        : normalizePlayerAvatar(raw, name)
      : null)

  const kind = variant === "team" ? "team_badge" as const : "player_avatar" as const

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
      kind={kind}
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
