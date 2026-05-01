import { NextRequest, NextResponse } from "next/server"

const STRAPI = () =>
  (process.env.SF_API_URL || "http://localhost:1337")
    .replace(/\/api-docs\/?$/, "")
    .replace(/\/$/, "")

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await req.json()

    const res = await fetch(
      `${STRAPI()}/api/watch-venues/${id}/xibo/settings`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    )
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: "Failed to update Xibo settings" }, { status: 500 })
  }
}
