import { notFound } from "next/navigation"
import { NewsExitGate } from "@/components/news-exit-gate"
import { getNewsExitConfig } from "@/lib/news-exit-config"
import { isExternalNewsUrl } from "@/lib/news-exit"

type NewsExitPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function NewsExitPage({ searchParams }: NewsExitPageProps) {
  const params = await searchParams
  const targetUrl = first(params.url) || ""
  if (!isExternalNewsUrl(targetUrl)) notFound()

  const config = await getNewsExitConfig()

  return (
    <NewsExitGate
      targetUrl={targetUrl}
      title={first(params.title) || "Read the full story"}
      source={first(params.source) || ""}
      delaySeconds={config.delaySeconds}
      autoRedirect={config.autoRedirect}
      message={config.message}
    />
  )
}
