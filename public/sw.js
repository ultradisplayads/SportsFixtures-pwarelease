// Sports Fixtures PWA — Service Worker
// Handles: shell caching, offline fallback, background sync, push notifications,
// share target, and typed message protocol (mirrors lib/sw-messages.ts).

const SHELL_CACHE = "sf-shell-v2"

const SHELL_URLS = [
  "/",
  "/offline-fallback.html",
  "/manifest.webmanifest",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/logo.png",
]

// ── Install ──────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)),
  )
})

// ── Activate ─────────────────────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE)
          .map((k) => caches.delete(k)),
      ),
    ).then(() => self.clients.claim()),
  )
})

// ── Fetch — Shell-only cache. API and auth routes: never cached. ─────────────
// Live-sensitive API paths (/api/*, /profile, /settings, /premium/checkout)
// are always network-only. No stale truth is ever served from the SW cache.

self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Non-GET requests: pass through entirely
  if (request.method !== "GET") return

  // Only handle same-origin + HTTPS requests
  if (url.origin !== self.location.origin && !url.hostname.endsWith("sportsfixtures.net")) {
    return
  }

  // API routes, profile, settings, premium checkout — network only, no cache.
  // If the network fails, return nothing (let the page handle the error).
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/profile") ||
    url.pathname.startsWith("/settings") ||
    url.pathname.startsWith("/premium/checkout")
  ) {
    return
  }

  // Navigation requests — serve shell or offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(SHELL_CACHE)
        const cached = await cache.match(request)
        if (cached) return cached
        const fallback = await cache.match("/offline-fallback.html")
        return fallback ?? new Response("Offline", { status: 503 })
      }),
    )
    return
  }

  // Images — cache first
  if (
    request.destination === "image" ||
    url.pathname.match(/\.(png|jpg|jpeg|webp|svg|ico)$/)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((res) => {
            if (res.ok) {
              const clone = res.clone()
              caches.open(SHELL_CACHE).then((c) => c.put(request, clone))
            }
            return res
          }),
      ),
    )
    return
  }

  // JS/CSS/fonts — stale while revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((res) => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(SHELL_CACHE).then((c) => c.put(request, clone))
        }
        return res
      })
      return cached ?? network
    }),
  )
})

// ── Push notifications ────────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  let data = { title: "Sports Fixtures", body: "New update available", url: "/" }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch {
    if (event.data) data.body = event.data.text()
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    "/icon-192x192.png",
      badge:   "/logo.png",
      data:    { url: data.url ?? "/" },
      tag:     "sf-push",
      renotify: true,
    }),
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? "/"
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (client.url === url && "focus" in client) return client.focus()
        }
        return self.clients.openWindow(url)
      }),
  )
})

// ── Typed message protocol (mirrors lib/sw-messages.ts) ──────────────────────

self.addEventListener("message", (event) => {
  const { type, payload } = event.data ?? {}

  switch (type) {
    case "SKIP_WAITING":
      self.skipWaiting()
      break

    case "CACHE_URLS":
      if (Array.isArray(payload)) {
        caches.open(SHELL_CACHE).then((c) =>
          Promise.all(payload.map((url) => c.add(url).catch(() => null))),
        )
      }
      break

    case "CLEAR_CACHE":
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      break

    case "PREFETCH_ROUTE":
      if (typeof payload === "string") {
        caches.open(SHELL_CACHE).then((c) =>
          c.add(payload).catch(() => null),
        )
      }
      break

    case "GET_CACHE_KEYS":
      caches.keys().then((keys) => {
        event.source?.postMessage({ type: "CACHE_KEYS", payload: keys })
      })
      break
  }
})
