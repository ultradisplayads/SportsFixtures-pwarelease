import { cachedProviderJson } from "@/lib/provider-cache"

export type NewsExitConfig = {
  delaySeconds: number
  autoRedirect: boolean
  message: string
}

const DEFAULT_CONFIG: NewsExitConfig = {
  delaySeconds: 5,
  autoRedirect: false,
  message: "You are leaving Sports Fixtures to read this story at the original publisher.",
}

const SF_API_URL = (process.env.SF_API_URL || "https://staging-api.sportsfixtures.net")
  .replace(/\/api-docs\/?$/, "")
  .replace(/\/$/, "")
const SF_API_TOKEN = process.env.SF_API_TOKEN || ""

function clampDelay(value: unknown) {
  const n = Number(value)
  if (!Number.isFinite(n)) return DEFAULT_CONFIG.delaySeconds
  return Math.min(Math.max(Math.round(n), 0), 30)
}

export async function getNewsExitConfig(): Promise<NewsExitConfig> {
  try {
    const raw = await cachedProviderJson({
      provider: "strapi",
      endpoint: "GET:/api/app-config?populate=*#news-exit",
      ttlSeconds: 300,
      fetcher: async () => {
        const res = await fetch(`${SF_API_URL}/api/app-config?populate=*`, {
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            ...(SF_API_TOKEN ? { Authorization: `Bearer ${SF_API_TOKEN}` } : {}),
          },
        })
        if (!res.ok) return null
        return res.json()
      },
    })
    const data = raw?.data?.attributes ?? raw?.data ?? raw ?? {}
    const nested = data.newsExit ?? data.news_exit ?? {}

    return {
      delaySeconds: clampDelay(
        nested.delaySeconds ??
        nested.delay_seconds ??
        data.newsExitDelaySeconds ??
        data.news_exit_delay_seconds,
      ),
      autoRedirect: Boolean(
        nested.autoRedirect ??
        nested.auto_redirect ??
        data.newsExitAutoRedirect ??
        data.news_exit_auto_redirect ??
        DEFAULT_CONFIG.autoRedirect,
      ),
      message:
        String(
          nested.message ??
          data.newsExitMessage ??
          data.news_exit_message ??
          DEFAULT_CONFIG.message,
        ).slice(0, 180),
    }
  } catch {
    return DEFAULT_CONFIG
  }
}
