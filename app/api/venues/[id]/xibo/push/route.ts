import { NextRequest, NextResponse } from "next/server"

const STRAPI = () =>
  (process.env.SF_API_URL || "http://localhost:1337")
    .replace(/\/api-docs\/?$/, "")
    .replace(/\/$/, "")

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params  // ← await params in Next.js 15

    const res = await fetch(
      `${STRAPI()}/api/watch-venues/${id}/xibo/push`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    )
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: "Push failed" }, { status: 500 })
  }
}