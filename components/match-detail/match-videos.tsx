"use client"

import { useEffect, useMemo, useState } from "react"
import { Play, Youtube, ExternalLink } from "lucide-react"
import { SmartImage } from "@/components/assets/smart-image"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { ExternalLinkGuard } from "@/components/platform/external-link-guard"

interface EventLike {
  strEvent?: string
  strSport?: string
  strLeague?: string
  dateEvent?: string
  strVideo?: string
}

interface HighlightLike {
  id: string
  title: string
  thumbnailUrl: string | null
  competition: string
  date: string
  videoUrl: string
}

interface VideoHighlight {
  id: string
  title: string
  thumbnail: string | null
  meta: string
  embedUrl?: string
  watchUrl?: string
}

function getYouTubeId(url: string) {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "") || null
    }
    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/embed/")[1] || null
      }
      return parsed.searchParams.get("v")
    }
  } catch {
    return null
  }
  return null
}

function toVideoItem(item: {
  id: string
  title: string
  videoUrl?: string
  thumbnail?: string | null
  meta?: string
}): VideoHighlight {
  const watchUrl = item.videoUrl || ""
  const youtubeId = getYouTubeId(watchUrl)
  return {
    id: item.id,
    title: item.title,
    thumbnail: item.thumbnail || null,
    meta: item.meta || "Video highlight",
    embedUrl: youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : undefined,
    watchUrl: watchUrl || undefined,
  }
}

function normaliseEventPayload(payload: any): EventLike {
  return payload?.data || payload?.event || payload?.events?.[0] || payload || {}
}

export function MatchVideos({ matchId }: { matchId: string }) {
  const [videos, setVideos] = useState<VideoHighlight[]>([])
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadVideos = async () => {
      setLoading(true)
      try {
        const eventRes = await fetch(`/api/events/${matchId}`, { cache: "no-store" }).catch(() => null)
        const eventPayload = eventRes?.ok ? await eventRes.json().catch(() => null) : null
        const event = normaliseEventPayload(eventPayload)

        const derivedVideos: VideoHighlight[] = []
        const directVideoUrl = event?.strVideo || ""

        if (directVideoUrl) {
          derivedVideos.push(
            toVideoItem({
              id: `event-${matchId}`,
              title: `${event?.strEvent || "Match"} – Official video`,
              videoUrl: directVideoUrl,
              thumbnail: null,
              meta: event?.strLeague || "Official clip",
            }),
          )
        }

        const sport = event?.strSport ? `?sport=${encodeURIComponent(event.strSport)}&limit=6` : "?limit=6"
        const highlightsRes = await fetch(`/api/highlights${sport}`, { cache: "no-store" }).catch(() => null)
        const highlightsPayload = highlightsRes?.ok ? await highlightsRes.json().catch(() => []) : []
        const highlights: HighlightLike[] = Array.isArray(highlightsPayload) ? highlightsPayload : []

        const highlightItems = highlights
          .filter((item) => !!item?.videoUrl)
          .map((item) =>
            toVideoItem({
              id: item.id,
              title: item.title,
              videoUrl: item.videoUrl,
              thumbnail: item.thumbnailUrl,
              meta: [item.competition, item.date].filter(Boolean).join(" • "),
            }),
          )
          .filter((item) => item.embedUrl || item.watchUrl)

        const merged = [...derivedVideos, ...highlightItems].filter(
          (item, index, arr) =>
            arr.findIndex((x) => x.watchUrl === item.watchUrl && x.title === item.title) === index,
        )

        if (!cancelled) {
          setVideos(merged)
          setSelectedVideoId((current) => current || merged[0]?.id || null)
        }
      } catch (error) {
        console.error("Error loading match videos:", error)
        if (!cancelled) {
          setVideos([])
          setSelectedVideoId(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadVideos()
    return () => { cancelled = true }
  }, [matchId])

  const selectedVideo = useMemo(
    () => videos.find((v) => v.id === selectedVideoId) || null,
    [selectedVideoId, videos],
  )

  const handleVideoClick = (videoId: string) => {
    triggerHaptic("medium")
    setSelectedVideoId(videoId)
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="aspect-video animate-pulse rounded-2xl bg-muted" />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (!videos.length) {
    return (
      <div className="p-4">
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <Youtube className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No video highlights available yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Highlights depend on broadcasters and publishing rights, so they often appear after the match.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      {selectedVideo && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="relative aspect-video bg-black">
            {selectedVideo.embedUrl ? (
              <iframe
                title={selectedVideo.title}
                src={selectedVideo.embedUrl}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center text-white">
                <div>
                  <p className="text-sm font-semibold">This video opens on the source site</p>
                  {selectedVideo.watchUrl && (
                    <ExternalLinkGuard
                      href={selectedVideo.watchUrl}
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
                    >
                      Open video
                      <ExternalLink className="h-4 w-4" />
                    </ExternalLinkGuard>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold">{selectedVideo.title}</h3>
            <p className="mt-2 text-xs text-muted-foreground">{selectedVideo.meta}</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-semibold">Highlights &amp; clips</h3>
        <div className="grid gap-3">
          {videos.map((video) => (
            <button
              key={video.id}
              onClick={() => handleVideoClick(video.id)}
              className={`group overflow-hidden rounded-xl border text-left transition-all hover:border-primary hover:shadow-md active:scale-[0.99] ${
                selectedVideoId === video.id ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              <div className="flex gap-3 p-2.5">
                <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <SmartImage
                    kind="generic"
                    src={video.thumbnail}
                    alt={video.title}
                    fallbackShape="rect"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/35 transition-all group-hover:bg-black/45">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90">
                      <Play className="h-5 w-5 fill-current text-black" />
                    </div>
                  </div>
                </div>
                <div className="min-w-0 flex-1 self-center">
                  <h4 className="line-clamp-2 text-sm font-medium">{video.title}</h4>
                  <p className="mt-1 text-[11px] text-muted-foreground">{video.meta}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/50 p-3">
        <p className="text-xs text-muted-foreground">
          Video availability depends on source rights and regional restrictions. When we can&apos;t safely embed a clip,
          we open the original source instead.
        </p>
      </div>
    </div>
  )
}
