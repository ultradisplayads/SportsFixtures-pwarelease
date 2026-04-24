import { NextRequest, NextResponse } from "next/server"

const getSFToken = () => process.env.SF_API_TOKEN || ""
const SF_API_URL = (process.env.SF_API_URL || "https://staging-api.sportsfixtures.net")
  .replace(/\/api-docs\/?$/, "")
  .replace(/\/$/, "")

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id || !/^\d+$/.test(id)) {
    return NextResponse.json({ success: false, data: null }, { status: 200 })
  }

  const token = getSFToken()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const response = await fetch(`${SF_API_URL}/api/venues/${id}`, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    clearTimeout(timeout)
    const text = await response.text()

    if (!response.ok) {
      return NextResponse.json({ success: false, data: null }, { status: 200 })
    }

    try {
      return NextResponse.json(JSON.parse(text))
    } catch {
      return NextResponse.json({ success: false, data: null }, { status: 200 })
    }
  } catch {
    clearTimeout(timeout)
    return NextResponse.json({ success: false, data: null }, { status: 200 })
  }
}
