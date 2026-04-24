"use client"

// ─────────────────────────────────────────────────────────────────────────────
// lib/notification-store.ts
//
// Section 02 — Transient in-session delivery buffer ONLY.
//
// This is NOT the notification history model. It is NOT a source of truth for
// the bell/history UI or unread counts. Those come from:
//   useNotifications().history      — DB-backed history list
//   useNotifications().unreadCount  — canonical unread badge count
//
// This store holds only transient in-session delivery items (e.g. UI pops,
// quirk events, ephemeral toasts) that have NOT been persisted to the DB.
// It feeds into header-menu.tsx as supplementary items only, clearly labelled
// as "local" and never duplicating DB history.
//
// Items here are lost on page reload — intentionally.
// ─────────────────────────────────────────────────────────────────────────────

export type TransientNotificationType =
  | "match_start"
  | "goal"
  | "half_time"
  | "full_time"
  | "reminder"
  | "news"
  | "venue"
  | "system"

export interface TransientNotification {
  id: string
  type: TransientNotificationType
  title: string
  body: string
  timestamp: number      // ms since epoch
  read: boolean
  deepLink: string       // e.g. /match/12345 or /venues/67 or /news
  entityType?: "match" | "team" | "venue" | "news" | "tv"
  entityId?: string
}

// ── In-memory store (intentionally NOT persisted to localStorage) ─────────────

let _store: TransientNotification[] = []
const MAX_ITEMS = 20  // modest limit — this is ephemeral only
const CHANGE_EVENT = "sf:transient-notification"

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }
}

export const notificationStore = {
  /** Subscribe to store changes. Returns unsubscribe fn. */
  subscribe(handler: () => void): () => void {
    if (typeof window === "undefined") return () => {}
    window.addEventListener(CHANGE_EVENT, handler)
    return () => window.removeEventListener(CHANGE_EVENT, handler)
  },

  getAll(): TransientNotification[] {
    return [..._store]
  },

  unreadCount(): number {
    return _store.filter((n) => !n.read).length
  },

  add(n: Omit<TransientNotification, "id" | "timestamp" | "read">): TransientNotification {
    const item: TransientNotification = {
      ...n,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      read: false,
    }
    _store = [item, ..._store].slice(0, MAX_ITEMS)
    emit()
    // Also dispatch legacy event key so any existing listeners still work
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sf:notification", { detail: item }))
    }
    return item
  },

  markRead(id: string) {
    _store = _store.map((n) => (n.id === id ? { ...n, read: true } : n))
    emit()
  },

  markAllRead() {
    _store = _store.map((n) => ({ ...n, read: true }))
    emit()
  },

  clear() {
    _store = []
    emit()
  },
}

// Keep backward-compat alias for legacy code still importing AppNotification
export type AppNotification = TransientNotification
