// components/assets/fallback-rect.tsx
// Section 08 — Safe rectangular placeholder for venue/article/banner images.
//
// Used by SmartImage when all candidate URLs fail and fallbackShape="rect".
// Never renders a broken browser image shell or a blank space.

interface FallbackRectProps {
  label: string
  className?: string
}

export function FallbackRect({ label, className = "h-20 w-full rounded-xl" }: FallbackRectProps) {
  const short = label?.trim()?.slice(0, 24) || "Missing image"

  return (
    <div
      role="img"
      aria-label={label}
      className={[
        "flex items-center justify-center bg-white/5 text-xs text-white/45",
        className,
      ].join(" ")}
    >
      {short}
    </div>
  )
}
