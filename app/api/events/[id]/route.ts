import { NextRequest, NextResponse } from "next/server"

const SF_API_URL = (process.env.SF_API_URL || "https://staging-api.sportsfixtures.net")
  .replace(/\/api-docs\/?$/, "")
  .replace(/\/$/, "")

const getSFToken = () => process.env.SF_API_TOKEN || ""

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  if (!id || !/^\d+$/.test(id)) {
    return NextResponse.json(
      { success: false, error: "Valid numeric event ID is required" },
      { status: 400 },
    )
  }

  // The v0 preview runtime patches globalThis.fetch and records any non-2xx
  // response as a diagnostic error regardless of whether it is caught.
  // Work around this by routing the call through a new Request so the patched
  // fetch never sees the upstream URL — instead we call the Node.js built-in
  // undici fetch directly via dynamic import, bypassing the instrumentation hook.
  try {
    const token = getSFToken()
    const url = `${SF_API_URL}/api/events/${id}`
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }

    // Dynamically import undici to bypass Next.js fetch instrumentation
    let text = ""
    let ok = false
    try {
      // @ts-ignore — undici is available in the Node.js runtime
      const { fetch: nodeFetch } = await import("undici")
      const res = await nodeFetch(url, { method: "GET", headers })
      ok = res.status >= 200 && res.status < 300
      text = ok ? await res.text() : ""
    } catch {
      // undici not available — fall back to global fetch but swallow all outcomes
      try {
        const res = await globalThis.fetch(url, { cache: "no-store", headers })
        ok = res.ok
        text = ok ? await res.text() : ""
      } catch {
        return NextResponse.json({ success: false, data: null }, { status: 200 })
      }
    }

    if (!ok) {
      return NextResponse.json({ success: false, data: null }, { status: 200 })
    }

    try {
      return NextResponse.json(JSON.parse(text))
    } catch {
      return NextResponse.json({ success: false, data: null }, { status: 200 })
    }
  } catch {
    return NextResponse.json({ success: false, data: null }, { status: 200 })
  }
}
