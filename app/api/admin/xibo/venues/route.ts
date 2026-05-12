import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/server/admin-auth"

const STRAPI = () =>
  (process.env.SF_API_URL || "http://localhost:1337")
    .replace(/\/api-docs\/?$/, "")
    .replace(/\/$/, "")

export async function GET(req: NextRequest) {
  const session = await requireAdminSession(req)
  if (!session.ok) return session.response

  try {
    const res = await fetch(
      `${STRAPI()}/api/watch-venues?pagination[pageSize]=200&sort=name:asc`,
      {
        cache: "no-store",
        headers: { Authorization: `Bearer ${session.jwt}` },
      }
    )

    if (!res.ok) throw new Error(`Strapi error: ${res.status}`)

    const json = await res.json()
    // watch-venues returns { success: true, data: [...] }
    const raw: any[] = json.data || []

    const venues = raw.map((v: any) => ({
      id: v.id,
      name: v.name,
      city: v.city || null,
      xiboEnabled: v.xiboEnabled || false,
      xiboDisplayGroupId: v.xiboDisplayGroupId || null,
      xiboLayoutId: v.xiboLayoutId || null,
      lastXiboPush: v.lastXiboPush || null,
      isConfigured: !!(v.selectedTeams?.length || v.selectedLeagues?.length),
      isProvisioned: !!v.xiboDisplayGroupId,
    }))

    // Sort: xibo enabled first, then alphabetical
    venues.sort((a: any, b: any) => {
      if (a.xiboEnabled && !b.xiboEnabled) return -1
      if (!a.xiboEnabled && b.xiboEnabled) return 1
      return (a.name || "").localeCompare(b.name || "")
    })

    return NextResponse.json({ venues })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch venues" },
      { status: 500 }
    )
  }
}
