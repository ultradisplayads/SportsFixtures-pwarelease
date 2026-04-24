// Service Worker Registration and Management

export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return
  }

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      })

      // Share device token with SW so it can persist push history to the DB (Section 02)
      const token = localStorage.getItem("sf_device_token")
      if (token) {
        const sw = registration.active ?? registration.installing ?? registration.waiting
        sw?.postMessage({ type: "STORE_DEVICE_TOKEN", token })
        // Also post once the SW becomes active
        navigator.serviceWorker.ready.then((reg) => {
          reg.active?.postMessage({ type: "STORE_DEVICE_TOKEN", token })
        })
      }

      // Check for updates every hour
      setInterval(
        () => {
          registration.update()
        },
        60 * 60 * 1000,
      )

      // Handle updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing
        if (!newWorker) return

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            // New service worker available
            if (confirm("New version available! Reload to update?")) {
              newWorker.postMessage({ type: "SKIP_WAITING" })
              window.location.reload()
            }
          }
        })
      })
    } catch (error) {
      console.error("[v0] Service Worker registration failed:", error)
    }
  })

  // Handle controller change
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload()
  })
}

export function unregisterServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return
  }

  navigator.serviceWorker.ready
    .then((registration) => {
      registration.unregister()
    })
    .catch((error) => {
      console.error("[v0] Service Worker unregistration failed:", error)
    })
}

export async function checkOnlineStatus(): Promise<boolean> {
  if (!navigator.onLine) {
    return false
  }

  try {
    const response = await fetch("/api/health", {
      method: "HEAD",
      cache: "no-cache",
    })
    return response.ok
  } catch {
    return false
  }
}
