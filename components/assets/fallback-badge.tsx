import type { AssetSize } from "@/types/assets"
import { ASSET_SIZE_CLASS } from "@/types/assets"

interface FallbackBadgeProps {
  label: string
  /**
   * Shortcut size token — maps to a fixed tailwind h/w class.
   * Overridden by an explicit `className` if both are provided.
   */
  size?: AssetSize
  className?: string
}

export function FallbackBadge({ label, size, className }: FallbackBadgeProps) {
  const short = label?.trim()?.slice(0, 2)?.toUpperCase() || "SF"
  // className wins; size token is a convenience when className is omitted
  const sizeClass = size ? ASSET_SIZE_CLASS[size] : "h-10 w-10"

  return (
    <div
      aria-label={label}
      className={[
        "inline-flex items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/75",
        className || sizeClass,
      ].join(" ")}
    >
      {short}
    </div>
  )
}
