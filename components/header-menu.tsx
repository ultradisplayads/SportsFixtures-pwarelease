"use client"

import type React from "react"

import { Menu, ChevronRight, Bell, Calendar, User, GripVertical, CheckCheck, Trash2, Crown, Star, MapPin } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import { usePushProvider } from "./notification-provider"
import { ThemeToggle } from "./theme-toggle"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { useState, useEffect } from "react"
import { LogoBadge } from "@/components/logo-badge"
import { notificationStore, type AppNotification } from "@/lib/notification-store"
import { useSubscription } from "@/lib/use-subscription"
import { isLaunchPassActive, LAUNCH_PASS_EXPIRY } from "@/lib/subscription-manager"
import { useNotifications } from "@/hooks/use-notifications"

interface MenuItem {
  id: string
  label: string
  href: string
  section: string
}

const DEFAULT_MENU_ITEMS: MenuItem[] = [
  // Quick Links
  { id: "home",     label: "Home",           href: "/",       section: "Quick Links" },
  { id: "live",     label: "Live Scores",    href: "/live",   section: "Quick Links" },
  { id: "fixtures", label: "Fixtures",       href: "/fixtures", section: "Quick Links" },
  { id: "results",  label: "Results",        href: "/results", section: "Quick Links" },
  { id: "tv",       label: "TV Guide",       href: "/tv",     section: "Quick Links" },
  { id: "news",     label: "News",           href: "/news",   section: "Quick Links" },
  // Watch Live
  { id: "venues", label: "Find Sports Bars Near Me", href: "/venues", section: "Watch Live" },
  { id: "sportsbarz", label: "SportsBarz.co", href: "https://sportsbarz.co", section: "Watch Live" },
  { id: "gfp", label: "GreatFoodPlaces.com", href: "https://greatfoodplaces.com", section: "Watch Live" },
  { id: "venue-signup", label: "Venue Owner Sign Up", href: "/venues/owner-signup", section: "Watch Live" },
  // Local Leagues
  { id: "pool", label: "Pool Leagues & Tables", href: "/local-leagues/pool", section: "Local Leagues" },
  { id: "darts", label: "Darts Leagues & Tables", href: "/local-leagues/darts", section: "Local Leagues" },
]

export function HeaderMenu() {
  const { sendLocalNotification, permission } = usePushProvider()
  const { tier, effectiveTier, isFounderVip } = useSubscription()
  const launchPassActive = isLaunchPassActive()
  const isBronze = tier === "bronze"
  const isGold = effectiveTier === "gold" && tier !== "founder_vip"
  const expiryFormatted = LAUNCH_PASS_EXPIRY.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })

  // DB-backed notification history
  const {
    history: dbHistory,
    unreadCount: dbUnreadCount,
    markRead: dbMarkRead,
    markAllRead: dbMarkAllRead,
    loaded: dbLoaded,
  } = useNotifications()

  // Transient in-session delivery items (not persisted, supplementary only)
  const [localNotifications, setLocalNotifications] = useState<AppNotification[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEFAULT_MENU_ITEMS)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)

  // Listen for local (in-memory) notifications
  useEffect(() => {
    setLocalNotifications(notificationStore.getAll())
    const handler = () => setLocalNotifications(notificationStore.getAll())
    window.addEventListener("sf:notification", handler)
    return () => window.removeEventListener("sf:notification", handler)
  }, [])

  // unreadCount: DB history is the primary source of truth.
  // Transient local items are added only as a supplementary count.
  // The bell badge must never blend two permanent histories silently.
  const localUnread = localNotifications.filter((n) => !n.read).length
  const unreadCount = dbUnreadCount + localUnread

  const handleMarkAllRead = () => {
    triggerHaptic("light")
    dbMarkAllRead()
    notificationStore.markAllRead()
    setLocalNotifications(notificationStore.getAll())
  }

  const handleClearAll = () => {
    triggerHaptic("medium")
    notificationStore.clear()
    setLocalNotifications([])
  }

  const handleNotificationClick = (n: AppNotification) => {
    triggerHaptic("selection")
    notificationStore.markRead(n.id)
    setLocalNotifications(notificationStore.getAll())
  }

  const handleDbNotificationClick = (id: number) => {
    triggerHaptic("selection")
    dbMarkRead(id)
  }

  // Load saved menu order from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("menu-order")
    if (saved) {
      try {
        setMenuItems(JSON.parse(saved))
      } catch (e) {
        console.error("[v0] Failed to load menu order:", e)
      }
    }
  }, [])

  // Save menu order to localStorage
  const saveMenuOrder = (items: MenuItem[]) => {
    localStorage.setItem("menu-order", JSON.stringify(items))
  }

  const handleDragStart = (id: string) => {
    setDraggedItem(id)
    triggerHaptic("selection")
  }

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedItem || draggedItem === targetId) return

    const draggedIndex = menuItems.findIndex((item) => item.id === draggedItem)
    const targetIndex = menuItems.findIndex((item) => item.id === targetId)

    const newItems = [...menuItems]
    const [removed] = newItems.splice(draggedIndex, 1)
    newItems.splice(targetIndex, 0, removed)

    setMenuItems(newItems)
  }

  const handleDragEnd = () => {
    if (draggedItem) {
      saveMenuOrder(menuItems)
      triggerHaptic("medium")
    }
    setDraggedItem(null)
  }

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode)
    triggerHaptic("selection")
  }

  const resetMenuOrder = () => {
    setMenuItems(DEFAULT_MENU_ITEMS)
    saveMenuOrder(DEFAULT_MENU_ITEMS)
    triggerHaptic("medium")
  }

  const handleLinkClick = () => {
    triggerHaptic("selection")
  }

  // Group menu items by section
  const groupedItems = menuItems.reduce(
    (acc, item) => {
      if (!acc[item.section]) {
        acc[item.section] = []
      }
      acc[item.section].push(item)
      return acc
    },
    {} as Record<string, MenuItem[]>,
  )

  return (
    <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
      <LogoBadge size={95} linked onClick={handleLinkClick} />

      {/* Centre — venue finder CTA */}
      <Link
        href="/venues"
        onClick={handleLinkClick}
        className="flex items-center gap-1.5 rounded-full bg-[#22c55e] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90 active:opacity-80"
      >
        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Places to Watch</span>
      </Link>

      <div className="flex items-center gap-1">
        <Sheet>
          <SheetTrigger asChild>
              <button
              className="relative rounded-lg p-2 hover:bg-accent transition-colors"
              aria-label="Notifications"
              onClick={() => triggerHaptic("light")}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] max-w-sm overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-left">Notifications</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              {/* Actions bar */}
              {(dbHistory.length > 0 || localNotifications.length > 0) && (
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {unreadCount > 0 ? `${unreadCount} unread` : "All read"}
                  </span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-accent"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={handleClearAll}
                      className="flex items-center gap-1 rounded px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Clear local
                    </button>
                  </div>
                </div>
              )}

              {/* DB-backed notification history */}
              {dbHistory.length === 0 && localNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="mb-3 h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm font-medium text-muted-foreground">No notifications yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Enable alerts in Settings to get match reminders and score updates.
                  </p>
                  <Link
                    href="/settings/notifications"
                    className="mt-4 rounded-lg border border-border bg-card px-4 py-2 text-xs font-medium hover:bg-accent transition-colors"
                  >
                    Manage notifications
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {/* DB history items */}
                  {dbHistory.map((n) => {
                    const catColor: Record<string, string> = {
                      match_reminder: "bg-blue-500",
                      kickoff:        "bg-red-500",
                      goal:           "bg-orange-500",
                      full_time:      "bg-green-600",
                      half_time:      "bg-yellow-500",
                      breaking_news:  "bg-purple-500",
                      transfer_news:  "bg-indigo-500",
                      venue_offer:    "bg-teal-500",
                    }
                    const catLabel: Record<string, string> = {
                      match_reminder: "Soon",
                      kickoff:        "KO",
                      goal:           "GOAL",
                      full_time:      "FT",
                      half_time:      "HT",
                      breaking_news:  "News",
                      transfer_news:  "Transfer",
                      venue_offer:    "Offer",
                    }
                    const elapsed = Math.round((Date.now() - new Date(n.created_at).getTime()) / 60000)
                    const timeLabel = elapsed < 1 ? "Just now" : elapsed < 60 ? `${elapsed}m ago` : `${Math.round(elapsed / 60)}h ago`

                    return (
                      <Link
                        key={`db-${n.id}`}
                        href={n.url || "/"}
                        onClick={() => handleDbNotificationClick(n.id)}
                        className={`rounded-lg border p-3 transition-colors hover:bg-accent ${
                          n.read ? "border-border bg-card" : "border-primary/20 bg-primary/5"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${catColor[n.category] ?? "bg-muted"}`}>
                            {catLabel[n.category] ?? "•"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{n.title}</p>
                            {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
                            <p className="mt-1 text-xs text-muted-foreground">{timeLabel}</p>
                          </div>
                          {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                        </div>
                      </Link>
                    )
                  })}

                  {/* Session-only transient items — not persisted, supplementary only */}
                  {localNotifications.length > 0 && dbHistory.length > 0 && (
                    <p className="px-1 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      This session
                    </p>
                  )}
                  {localNotifications.map((n) => {
                    const typeColor: Record<string, string> = {
                      match_start: "bg-red-500",
                      goal:        "bg-orange-500",
                      fulltime:    "bg-green-500",
                      halftime:    "bg-yellow-500",
                      reminder:    "bg-blue-500",
                      news:        "bg-purple-500",
                      venue:       "bg-teal-500",
                      system:      "bg-muted",
                    }
                    const typeLabel: Record<string, string> = {
                      match_start: "LIVE",
                      goal:        "GOAL",
                      fulltime:    "FT",
                      halftime:    "HT",
                      reminder:    "Soon",
                      news:        "News",
                      venue:       "Venue",
                      system:      "Info",
                    }
                    const elapsed = Math.round((Date.now() - n.timestamp) / 60000)
                    const timeLabel = elapsed < 1 ? "Just now" : elapsed < 60 ? `${elapsed}m ago` : `${Math.round(elapsed / 60)}h ago`

                    return (
                      <Link
                        key={`local-${n.id}`}
                        href={n.deepLink}
                        onClick={() => handleNotificationClick(n)}
                        className={`rounded-lg border p-3 transition-colors hover:bg-accent ${
                          n.read ? "border-border bg-card" : "border-primary/20 bg-primary/5"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${typeColor[n.type] ?? "bg-muted"}`}>
                            {typeLabel[n.type] ?? ""}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${!n.read ? "text-foreground" : ""}`}>{n.title}</p>
                            <p className="text-xs text-muted-foreground">{n.body}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{timeLabel}</p>
                          </div>
                          {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        <Sheet>
          <SheetTrigger asChild>
            <button
              className="rounded-lg p-2 hover:bg-accent transition-colors"
              aria-label="Date picker"
              onClick={() => triggerHaptic("light")}
            >
              <Calendar className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] max-w-sm">
            <SheetHeader>
              <SheetTitle className="text-left">Select Date</SheetTitle>
            </SheetHeader>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/?date=yesterday"
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:bg-accent transition-colors"
              >
                <span className="font-medium">Yesterday</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link
                href="/?date=today"
                className="flex items-center justify-between rounded-lg border-2 border-primary bg-primary/5 p-4 hover:bg-primary/10 transition-colors"
              >
                <span className="font-semibold text-primary">Today</span>
                <ChevronRight className="h-4 w-4 text-primary" />
              </Link>
              <Link
                href="/?date=tomorrow"
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:bg-accent transition-colors"
              >
                <span className="font-medium">Tomorrow</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <div className="my-4 border-t border-border" />
              <div className="rounded-lg border border-border bg-card p-4">
                <label className="text-sm font-medium">Custom Date</label>
                <input
                  type="date"
                  className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  defaultValue={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Sheet>
          <SheetTrigger asChild>
            <button
              className="rounded-lg p-2 hover:bg-accent transition-colors"
              aria-label="User account"
              onClick={() => triggerHaptic("light")}
            >
              <User className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] max-w-sm overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-left">Account</SheetTitle>
            </SheetHeader>
            <div className="mt-6 flex flex-col gap-6">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
                <LogoBadge size={40} linked={false} showWordmark={false} />
                <div className="flex-1">
                  <p className="font-semibold">Guest User</p>
                  <p className="text-xs text-muted-foreground">Sign in to save preferences</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Link
                  href="/auth/signin"
                  className="flex items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signin"
                  className="flex items-center justify-center rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-accent transition-colors"
                >
                  Create Account
                </Link>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="mb-3 text-sm font-semibold">Quick Access</h3>
                <div className="flex flex-col gap-2">
                  <Link
                    href="/favourites"
                    className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-accent"
                  >
                    <span>My Favourites</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <Link
                    href="/social"
                    className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-accent"
                  >
                    <span>My Stats & Points</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <Link
                    href="/premium"
                    className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-accent"
                  >
                    <span>Upgrade to Premium</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-accent"
                  >
                    <span>Settings</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <ThemeToggle />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Sheet>
          <SheetTrigger asChild>
            <button
              className="rounded-lg p-2 hover:bg-accent transition-colors"
              aria-label="Open menu"
              onClick={() => triggerHaptic("light")}
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent className="w-[85vw] max-w-sm overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-left">Menu</SheetTitle>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={toggleEditMode}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    isEditMode
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-accent"
                  }`}
                >
                  {isEditMode ? "Done" : "Personalize"}
                </button>
                {isEditMode && (
                  <button
                    onClick={resetMenuOrder}
                    className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-accent transition-colors"
                  >
                    Reset Order
                  </button>
                )}
              </div>
            </SheetHeader>

            <nav className="mt-6 flex flex-col gap-6 pb-6">

              {/* ── Upgrade prompt (Bronze users) ── */}
              {isBronze && (
                <div className="rounded-xl overflow-hidden border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-amber-400/5">
                  <div className="flex items-start gap-3 px-4 pt-4 pb-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-amber-400">
                      <Crown className="h-4.5 w-4.5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Gold Launch Pass — Free</p>
                      <p className="text-xs text-muted-foreground">
                        All Gold features free until <span className="font-medium text-foreground">{expiryFormatted}</span>. Lock in Founder pricing now.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/premium"
                    onClick={() => triggerHaptic("selection")}
                    className="flex items-center justify-between border-t border-yellow-500/20 bg-yellow-500/10 px-4 py-2.5 text-sm font-semibold text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/20 transition-colors"
                  >
                    View plans &amp; pricing
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              )}

              {/* ── Founder VIP prompt (Gold users — not already Founder VIP) ── */}
              {isGold && !isFounderVip && (
                <div className="rounded-xl overflow-hidden border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-400/5">
                  <div className="flex items-start gap-3 px-4 pt-4 pb-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-600">
                      <Star className="h-4.5 w-4.5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Become a Founder VIP</p>
                      <p className="text-xs text-muted-foreground">
                        Lifetime access for £199 — one payment, never expires. Support the team.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/premium"
                    onClick={() => triggerHaptic("selection")}
                    className="flex items-center justify-between border-t border-purple-500/20 bg-purple-500/10 px-4 py-2.5 text-sm font-semibold text-purple-700 dark:text-purple-400 hover:bg-purple-500/20 transition-colors"
                  >
                    Claim Founder VIP
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              )}

              {Object.entries(groupedItems).map(([section, items]) => (
                <div key={section}>
                  <h3 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">{section}</h3>
                  <div className="flex flex-col gap-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        draggable={isEditMode}
                        onDragStart={() => handleDragStart(item.id)}
                        onDragOver={(e) => handleDragOver(e, item.id)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center gap-2 rounded-lg transition-all ${
                          isEditMode ? "cursor-move bg-accent/50" : ""
                        } ${draggedItem === item.id ? "opacity-50" : ""}`}
                      >
                        {isEditMode && (
                          <div className="px-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <Link
                          href={item.href}
                          className={`flex flex-1 items-center justify-between rounded-lg px-3 py-2 hover:bg-accent ${
                            isEditMode ? "pointer-events-none" : ""
                          }`}
                          onClick={!isEditMode ? handleLinkClick : undefined}
                          {...(item.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        >
                          <span className={item.id === "venue-signup" ? "font-medium text-primary" : ""}>
                            {item.label}
                          </span>
                          <ChevronRight
                            className={`h-4 w-4 ${
                              item.id === "venue-signup" ? "text-primary" : "text-muted-foreground"
                            }`}
                          />
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
