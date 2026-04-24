type IndexNowPayload = {
  host: string
  key: string
  keyLocation: string
  urlList: string[]
}

type IndexNowResult = {
  sent: boolean
  status?: number
  error?: string
}

export async function pushIndexNow(urlList: string[]): Promise<IndexNowResult> {
  const key = process.env.INDEXNOW_KEY
  const host = "sportsfixtures.net"

  if (!key) return { sent: false, error: "INDEXNOW_KEY not set" }
  if (!urlList.length) return { sent: false, error: "empty URL list" }

  const payload: IndexNowPayload = {
    host,
    key,
    keyLocation: `https://${host}/${key}.txt`,
    urlList,
  }

  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    })
    return { sent: res.ok, status: res.status }
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : "unknown error" }
  }
}

/**
 * Helper: push a single URL to IndexNow.
 * Use when a match, article, or venue page changes materially.
 */
export async function pushSingleUrl(path: string): Promise<IndexNowResult> {
  const url = `https://sportsfixtures.net${path.startsWith("/") ? path : `/${path}`}`
  return pushIndexNow([url])
}
