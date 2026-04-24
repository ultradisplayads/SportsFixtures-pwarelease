"use client"

import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

/** Explicit app brand icon — intentional, not a sports entity fallback. */
const APP_BRAND_ICON = "/logo.png"

interface LogoBadgeProps {
  /** Size in px — controls both width and height */
  size?: number
  /** If true, wraps in a Link to "/" */
  linked?: boolean
  /** Show the wordmark beside the badge */
  showWordmark?: boolean
  className?: string
  onClick?: () => void
}

export function LogoBadge({ size = 40, linked = true, showWordmark = true, className, onClick }: LogoBadgeProps) {
  const content = (
    <div className={cn("flex items-center gap-2", className)} onClick={onClick}>
      <Image
        src={APP_BRAND_ICON}
        alt="Sports Fixtures logo"
        width={size}
        height={size}
        className="rounded-md object-contain"
        priority
      />
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span className="text-sm font-black tracking-tight text-foreground">Sports Fixtures</span>
          <span className="text-[10px] font-medium text-primary">sportsfixtures.net</span>
        </div>
      )}
    </div>
  )

  if (!linked) return content

  return (
    <Link href="/" aria-label="Sports Fixtures home">
      {content}
    </Link>
  )
}

/** Square logo-only badge for tight spaces (splash, onboarding, etc.) */
export function LogoSquare({ size = 56, className }: { size?: number; className?: string }) {
  return (
    <Image
      src={APP_BRAND_ICON}
      alt="Sports Fixtures"
      width={size}
      height={size}
      className={cn("rounded-xl object-contain", className)}
      priority
    />
  )
}
