import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const host = request.headers.get("host") || ""
  const protocol = request.headers.get("x-forwarded-proto") || "https"
  const userAgent = request.headers.get("user-agent")?.toLowerCase() || ""

  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    ""

  if (process.env.NODE_ENV === "development") {
    return NextResponse.next()
  }

  const allowedDomains = [
    "sportsfixtures.net",
    "www.sportsfixtures.net",
    "staging.sportsfixtures.net",
    "app.sportsfixtures.net",
    "zixe.net",
    "www.zixe.net",
    "api.zixe.net",
  ]

  const allowedIps = ["119.155.171.177"]

  const isAllowedDomain = allowedDomains.some(
    (domain) => host === domain || host.endsWith(`.${domain}`)
  )
  const isAllowedIp = allowedIps.includes(clientIp)
  const isLocalhost =
    host.includes("localhost") ||
    host.includes("127.0.0.1") ||
    clientIp === "127.0.0.1" ||
    clientIp === "::1"
  const isVercel =
    host.endsWith(".vercel.app") || host.endsWith(".vusercontent.net")

  if (!isAllowedDomain && !isAllowedIp && !isLocalhost && !isVercel) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const bots = [
    "googlebot", "bingbot", "duckduckbot", "yandex", "embedly",
    "outbrain", "pinterest", "rogerbot", "showyoubot", "tumblr",
    "vkshare", "w3c_validator", "redditbot", "applebot", "flipboard",
    "google-structured-data-testing-tool",
  ]

  const isBot = bots.some((bot) => userAgent.includes(bot))

  if (isBot && process.env.PRERENDER_TOKEN) {
    const currentUrl = `${protocol}://${host}${pathname}${search}`
    const prerenderUrl = `https://service.prerender.io/${encodeURIComponent(currentUrl)}`
    const response = NextResponse.rewrite(new URL(prerenderUrl))
    response.headers.set("X-Prerender-Token", process.env.PRERENDER_TOKEN)
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap|.*\\.(?:svg|png|jpg|jpeg|gif|webp|xml)$).*)",
  ],
}
