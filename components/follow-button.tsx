"use client"

/**
 * components/follow-button.tsx
 *
 * Universal follow/unfollow button.
 *
 * - Backed by the shared useFollows hook (no local shadow state for active flag)
 * - Optimistic: toggle is instant, rolls back on API failure
 * - Accessible: aria-pressed, aria-label
 * - Haptic feedback via triggerHaptic (gracefully degraded)
 * - Supports all EntityType values: team, league, competition, player, venue
 */

import { useMemo, useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { useFollows } from "@/hooks/use-follows"
import { triggerHaptic } from "@/lib/haptic-feedback"
import type { EntityType, Favourite } from "@/lib/favourites-api"

interface FollowButtonProps {
  entityType: EntityType
  entityId: string
  entityName?: string
  entityLogo?: string
  entityMeta?: Record<string, string>
  /** Visual size variant */
  size?: "sm" | "md" | "lg"
  /** Render as icon-only (no label) */
  iconOnly?: boolean
  className?: string
  /** Called after follow state changes — receives new boolean */
  onToggle?: (following: boolean) => void
}

const SIZE_MAP = {
  sm: { icon: "h-3.5 w-3.5", btn: "px-2.5 py-1.5 text-xs gap-1.5 rounded-lg" },
  md: { icon: "h-4 w-4",     btn: "px-3 py-2 text-sm gap-2 rounded-xl" },
  lg: { icon: "h-5 w-5",     btn: "px-4 py-2.5 text-sm gap-2 rounded-xl" },
}

export function FollowButton({
  entityType,
  entityId,
  entityName,
  entityLogo,
  entityMeta,
  size = "md",
  iconOnly = false,
  className = "",
  onToggle,
}: FollowButtonProps) {
  // Derive active state from the shared store — no local mirror needed
  const { has, toggle } = useFollows()
  const [isPending, setIsPending] = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [burst,     setBurst]     = useState(false)

  const active = has(entityType, entityId)

  const payload: Favourite = useMemo(
    () => ({
      entity_type: entityType,
      entity_id:   entityId,
      entity_name: entityName,
      entity_logo: entityLogo,
      entity_meta: entityMeta,
    }),
    [entityType, entityId, entityName, entityLogo, entityMeta]
  )

  const label =
    entityType === "venue"
      ? active ? "Saved" : "Save Venue"
      : active ? "Following" : "Follow"

  async function handleClick() {
    if (isPending) return
    setError(null)
    setIsPending(true)
    triggerHaptic(active ? "light" : "medium")

    if (!active) {
      setBurst(true)
      setTimeout(() => setBurst(false), 600)
    }

    try {
      const nowActive = await toggle(payload)
      onToggle?.(nowActive)
    } catch {
      setError("Could not update follow state")
    } finally {
      setIsPending(false)
    }
  }

  const { icon, btn } = SIZE_MAP[size]

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-pressed={active}
        aria-label={
          active
            ? `Unfollow ${entityName ?? entityType}`
            : `Follow ${entityName ?? entityType}`
        }
        className={cn(
          "flex shrink-0 items-center font-semibold transition-all active:scale-95 disabled:opacity-60",
          btn,
          active
            ? "border border-primary/40 bg-primary/10 text-primary"
            : "border border-border bg-card text-foreground hover:border-primary/60 hover:bg-primary/5",
          burst ? "scale-110" : "",
          className
        )}
      >
        <Star
          className={cn(
            icon,
            "transition-transform",
            active ? "fill-primary text-primary" : "text-muted-foreground",
            burst ? "scale-125" : ""
          )}
          aria-hidden="true"
        />
        {!iconOnly && <span>{label}</span>}
      </button>
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  )
}
