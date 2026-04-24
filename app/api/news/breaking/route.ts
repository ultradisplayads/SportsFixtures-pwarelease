import { NextResponse } from "next/server"

const SF_API_URL = (process.env.SF_API_URL || process.env.NEXT_PUBLIC_SF_API_URL || "")
  .replace(/\/api-docs\/?$/, "")
  .replace(/\/$/, "")
const SF_API_TOKEN = process.env.SF_API_TOKEN || ""

export async function GET() {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6000)

  try {
    const url = `${SF_API_URL}/api/news?filters[isBreaking][$eq]=true&sort=publishedAt:desc&pagination[pageSize]=8`
    const res = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(SF_API_TOKEN ? { Authorization: `Bearer ${SF_API_TOKEN}` } : {}),
      },
    })
    clearTimeout(timeout)

    const text = await res.text()
    if (!res.ok) return NextResponse.json({ data: [] }, { status: 200 })

    try {
      const json = JSON.parse(text)
      const articles = json?.data ?? json?.articles ?? []
      return NextResponse.json({ data: articles })
    } catch {
      return NextResponse.json({ data: [] }, { status: 200 })
    }
  } catch {
    clearTimeout(timeout)
    return NextResponse.json({ data: [] }, { status: 200 })
  }
}
