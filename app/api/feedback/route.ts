import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { score, tags, comment, userId, email, page } = body

    const SF_API_URL = (process.env.SF_API_URL || "https://staging-api.sportsfixtures.net")
      .replace(/\/api-docs\/?$/, "").replace(/\/$/, "")
    const SF_API_TOKEN = process.env.SF_API_TOKEN || ""

    await fetch(`${SF_API_URL}/api/feedbacks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(SF_API_TOKEN ? { Authorization: `Bearer ${SF_API_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        data: { score, tags: tags?.join(", "), comment, userId, email, page }
      }),
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
