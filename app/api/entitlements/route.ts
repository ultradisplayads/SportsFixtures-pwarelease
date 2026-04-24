// GET /api/entitlements
// Returns a NormalizedEnvelope wrapping the entitlement profile, gates, and plans.
// This is the single internal truth for free vs premium state.
// It derives from subscription-manager (device-local) today;
// replace buildEntitlementProfile() with a session/DB lookup when auth is wired.

import { NextResponse } from "next/server"
import {
  buildEntitlementProfile,
  buildDefaultGates,
  buildPlans,
  normalizePlanOrder,
} from "@/lib/monetization"
import { makeSuccessEnvelope } from "@/lib/contracts"
import type { EntitlementsResponse } from "@/types/monetization"
import type { NormalizedEnvelope } from "@/types/contracts"

export const dynamic = "force-dynamic"

export async function GET(): Promise<NextResponse<NormalizedEnvelope<EntitlementsResponse>>> {
  const profile = buildEntitlementProfile()
  const gates   = buildDefaultGates(profile)
  const plans   = normalizePlanOrder(buildPlans())

  const envelope = makeSuccessEnvelope<EntitlementsResponse>({
    data: { profile, gates, plans },
    source: "internal",
    maxAgeSeconds: 60, // entitlements revalidate within 1 minute
    confidence: "high",
  })

  return NextResponse.json(envelope)
}
