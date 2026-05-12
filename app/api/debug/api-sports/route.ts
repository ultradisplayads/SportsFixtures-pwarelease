import { NextRequest, NextResponse } from "next/server"
import { getApiSportsProducts, hasApiSportsKey } from "@/lib/api-sports"
import { requireAdminSession } from "@/lib/server/admin-auth"

export async function GET(req: NextRequest) {
  const session = await requireAdminSession(req)
  if (!session.ok) return session.response

  const products = await getApiSportsProducts()

  return NextResponse.json({
    configured: hasApiSportsKey(),
    liveProductBudget: Number(process.env.API_SPORTS_LIVE_PRODUCT_BUDGET || products.length),
    liveDetailBudget: Number(process.env.API_SPORTS_LIVE_DETAIL_BUDGET || 2),
    products: products.map((product) => ({
      key: product.key,
      label: product.label,
      sport: product.sport,
      baseUrl: product.baseUrl,
      plan: product.plan,
      dailyLimit: product.dailyLimit,
      enabled: product.enabled,
      supportsLive: product.supportsLive,
      liveEndpoint: product.liveEndpoint || null,
      subscriptionEnd: product.subscriptionEnd || null,
    })),
  })
}
