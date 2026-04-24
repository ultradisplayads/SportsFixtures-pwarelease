"use client"

// Section 10 — External Link Guard
// Single abstraction point for all external URL handling.
//
// Rules:
// - Every link to an https:// URL must go through this component
// - Native shells override the click handler to use in-app browser
//   (SFSafariViewController / Chrome Custom Tabs) instead of a new tab
// - Do NOT scatter target="_blank" rel="noreferrer" across components —
//   use ExternalLinkGuard so native wrappers have one place to override

import { type AnchorHTMLAttributes, type ReactNode, useCallback } from "react"
import { cn } from "@/lib/utils"

interface ExternalLinkGuardProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string
  children: ReactNode
  /** Override display style — defaults to inline */
  className?: string
}

function isExternalUrl(href: string): boolean {
  return /^https?:\/\//.test(href)
}

/**
 * Renders a safe anchor element for any URL.
 *
 * - Internal paths ("/...") → standard <a href> with no extra attributes
 * - External URLs ("https://...") → opens in new tab with rel="noreferrer noopener"
 *
 * Native shells intercept clicks via the global __SF_EXTERNAL_LINK_HANDLER
 * injection point rather than requiring component changes.
 */
export function ExternalLinkGuard({
  href,
  children,
  className,
  onClick,
  ...rest
}: ExternalLinkGuardProps) {
  const isExternal = isExternalUrl(href)

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Native shell injection point — if a handler is registered, delegate to it
      const nativeHandler = (window as any).__SF_EXTERNAL_LINK_HANDLER
      if (isExternal && typeof nativeHandler === "function") {
        e.preventDefault()
        nativeHandler(href)
        return
      }
      onClick?.(e)
    },
    [href, isExternal, onClick],
  )

  if (!isExternal) {
    return (
      <a href={href} className={className} onClick={onClick} {...rest}>
        {children}
      </a>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(className)}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </a>
  )
}
