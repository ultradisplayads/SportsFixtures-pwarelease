import { NextRequest, NextResponse } from "next/server"
import type { SubscriptionTier } from "@/lib/subscription-manager"

const SF_API_URL = (process.env.SF_API_URL || "https://staging-api.sportsfixtures.net")
  .replace(/\/api-docs\/?$/, "")
  .replace(/\/$/, "")
const SF_API_TOKEN = process.env.SF_API_TOKEN || ""

type RedeemResult = {
  valid: boolean
  code: string
  title?: string
  message?: string
  tier?: SubscriptionTier
  expiresAt?: string | null
  discountPercent?: number
  addOns?: string[]
}

const LOCAL_CODES: Record<string, Omit<RedeemResult, "valid" | "code">> = {
  FOUNDER: {
    title: "Founder VIP unlocked",
    message: "Lifetime Founder VIP has been applied to this device.",
    tier: "founder_vip",
    expiresAt: null,
    discountPercent: 100,
    addOns: ["vip_badge", "venue_discounts", "priority_support"],
  },
  VIP199: {
    title: "Founder VIP offer applied",
    message: "Founder VIP upgrade discount is ready for checkout.",
    tier: "founder_vip",
    expiresAt: null,
    discountPercent: 25,
    addOns: ["vip_discount"],
  },
  GOLDPASS: {
    title: "Gold upgrade applied",
    message: "Gold access has been applied for 12 months.",
    tier: "gold",
    discountPercent: 100,
    addOns: ["ad_free", "all_alerts", "premium_stats"],
  },
  SILVER50: {
    title: "Silver discount applied",
    message: "Silver upgrade discount is ready for checkout.",
    tier: "silver",
    discountPercent: 50,
    addOns: ["reduced_ads", "unlimited_alerts"],
  },
  VENUE20: {
    title: "VIP venue discount added",
    message: "Venue discount add-on saved for partner offers.",
    tier: "gold",
    discountPercent: 20,
    addOns: ["venue_discounts"],
  },
}

function normaliseCode(value: unknown): string {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "")
}

function expiryFromMonths(months = 12): string {
  const date = new Date()
  date.setMonth(date.getMonth() + months)
  return date.toISOString()
}

async function redeemWithStrapi(args: {
  code: string
  deviceToken?: string | null
  userId?: string | null
}): Promise<RedeemResult | null> {
  if (!SF_API_URL) return null

  try {
    const res = await fetch(`${SF_API_URL}/api/redeem-codes/validate`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(SF_API_TOKEN ? { Authorization: `Bearer ${SF_API_TOKEN}` } : {}),
      },
      body: JSON.stringify(args),
    })

    if (!res.ok) return null
    const json = await res.json()
    const data = json?.data || json
    if (!data?.valid) {
      return {
        valid: false,
        code: args.code,
        message: data?.message || "This code is not valid or has expired.",
      }
    }

    return {
      valid: true,
      code: args.code,
      title: data.title || "Code applied",
      message: data.message || "Your offer has been applied.",
      tier: data.tier,
      expiresAt: data.expiresAt ?? null,
      discountPercent: data.discountPercent,
      addOns: Array.isArray(data.addOns) ? data.addOns : [],
    }
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const code = normaliseCode(body.code)
  const deviceToken = req.headers.get("x-device-token") || body.deviceToken || null
  const userId = body.userId || null

  if (!code) {
    return NextResponse.json({ valid: false, message: "Enter a code to redeem." }, { status: 400 })
  }

  const strapiResult = await redeemWithStrapi({ code, deviceToken, userId })
  if (strapiResult) return NextResponse.json(strapiResult)

  const local = LOCAL_CODES[code]
  if (!local) {
    return NextResponse.json({
      valid: false,
      code,
      message: "Code not recognised. Check the spelling or try another code.",
    })
  }

  return NextResponse.json({
    valid: true,
    code,
    ...local,
    expiresAt: local.expiresAt === null ? null : local.expiresAt || expiryFromMonths(12),
  })
}
