"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Trash2 } from "lucide-react"
import { HeaderMenu } from "@/components/header-menu"
import { BottomNav } from "@/components/bottom-nav"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { useToast } from "@/hooks/use-toast"

export default function DeleteAccountPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [confirm, setConfirm] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  const CONFIRM_PHRASE = "delete my account"
  const ready = confirm.toLowerCase() === CONFIRM_PHRASE

  const handleDelete = async () => {
    if (!ready) return
    triggerHaptic("heavy")
    setDeleting(true)
    setError("")
    try {
      // Server-side deletion — removes favourites, push subscriptions, analytics rows
      const deviceToken = localStorage.getItem("sf_device_token")
      if (deviceToken) {
        const res = await fetch("/api/account/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceToken }),
        })
        const json = await res.json()
        if (!json.success) throw new Error("Server deletion failed")
      }

      // Client-side cleanup
      localStorage.clear()
      sessionStorage.clear()
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map((r) => r.unregister()))
      }
      if ("caches" in window) {
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
      }

      toast({ title: "Account deleted", description: "All your data has been permanently removed." })
      router.replace("/onboarding")
    } catch {
      setDeleting(false)
      setError("Could not delete account data. Please try again or contact support.")
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <HeaderMenu />
      <main className="flex-1 p-4">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-destructive/10 p-2.5">
            <Trash2 className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Delete Account</h1>
            <p className="text-sm text-muted-foreground">This cannot be undone</p>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-destructive">What will be deleted</p>
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                <li>All favourite teams and leagues</li>
                <li>Your predictions and points</li>
                <li>Notification preferences</li>
                <li>Subscription status</li>
                <li>All cached data on this device</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Type <span className="font-mono font-bold text-destructive">{CONFIRM_PHRASE}</span> to confirm
            </label>
            <input
              type="text"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-destructive"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            onClick={handleDelete}
            disabled={!ready || deleting}
            className={`w-full rounded-xl py-3.5 text-sm font-bold transition-all active:scale-95 ${
              ready
                ? "bg-destructive text-destructive-foreground"
                : "cursor-not-allowed bg-muted text-muted-foreground"
            }`}
          >
            {deleting ? "Deleting..." : "Permanently Delete Account"}
          </button>

          <button
            onClick={() => router.back()}
            className="w-full rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground"
          >
            Cancel
          </button>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
