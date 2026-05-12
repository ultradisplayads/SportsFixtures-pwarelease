"use client"

import { Gift, Loader2, TicketPercent } from "lucide-react"
import { useState } from "react"
import { getDeviceToken } from "@/lib/favourites-api"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { useSubscription } from "@/lib/use-subscription"
import { useToast } from "@/hooks/use-toast"
import type { SubscriptionTier } from "@/lib/subscription-manager"

type RedeemResponse = {
  valid: boolean
  code?: string
  title?: string
  message?: string
  tier?: SubscriptionTier
  expiresAt?: string | null
  discountPercent?: number
  addOns?: string[]
}

function tierLabel(tier?: string) {
  if (tier === "founder_vip") return "Founder VIP"
  if (tier === "gold") return "Gold"
  if (tier === "silver") return "Silver"
  if (tier === "bronze") return "Bronze"
  return "Offer"
}

export function RedeemCodeCard() {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RedeemResponse | null>(null)
  const { redeem } = useSubscription()
  const { toast } = useToast()

  const submit = async () => {
    const clean = code.trim().toUpperCase().replace(/\s+/g, "")
    if (!clean || loading) return
    triggerHaptic("light")
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch("/api/redeem-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-device-token": getDeviceToken(),
        },
        body: JSON.stringify({ code: clean }),
      })
      const data = await res.json() as RedeemResponse
      setResult(data)

      if (data.valid && data.tier) {
        redeem({
          tier: data.tier,
          code: data.code || clean,
          expiresAt: data.expiresAt,
          discountPercent: data.discountPercent,
        })
        triggerHaptic("success")
        toast({
          title: data.title || `${tierLabel(data.tier)} applied`,
          description: data.message || "Your code has been redeemed.",
        })
      } else if (!data.valid) {
        triggerHaptic("error")
      }
    } catch {
      setResult({ valid: false, message: "Could not redeem that code. Try again." })
      triggerHaptic("error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="redeem-code" className="mx-4 my-4 scroll-mt-20 rounded-2xl border border-primary/25 bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <TicketPercent className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black">Redeem a code</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Unlock discounts, add-ons, Gold, Founder VIP, venue perks or partner upgrades.
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          onKeyDown={(event) => {
            if (event.key === "Enter") submit()
          }}
          placeholder="ENTER CODE"
          autoCapitalize="characters"
          className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-3 text-sm font-black uppercase tracking-wide outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={submit}
          disabled={loading || !code.trim()}
          className="flex min-w-[92px] items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
          Apply
        </button>
      </div>

      {result && (
        <div className={`mt-3 rounded-xl border p-3 text-sm ${
          result.valid
            ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300"
            : "border-destructive/30 bg-destructive/10 text-destructive"
        }`}>
          <p className="font-bold">{result.title || (result.valid ? "Code applied" : "Code not applied")}</p>
          {result.message && <p className="mt-0.5 text-xs opacity-85">{result.message}</p>}
          {result.valid && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.tier && (
                <span className="rounded-full bg-background/70 px-2 py-1 text-[10px] font-black">
                  {tierLabel(result.tier)}
                </span>
              )}
              {result.discountPercent != null && (
                <span className="rounded-full bg-background/70 px-2 py-1 text-[10px] font-black">
                  {result.discountPercent}% discount
                </span>
              )}
              {(result.addOns || []).map((addOn) => (
                <span key={addOn} className="rounded-full bg-background/70 px-2 py-1 text-[10px] font-black">
                  {addOn.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
