import { NextResponse } from "next/server"
import { providerCacheStatus } from "@/lib/provider-cache"

export async function GET() {
  return NextResponse.json(providerCacheStatus(), {
    headers: { "Cache-Control": "no-store" },
  })
}
