"use client"

import Image from "next/image"
import { Tv } from "lucide-react"
import type { MatchIntelligenceEnvelope, MatchTvInfo, MatchTvChannel } from "@/types/match-intelligence"
import { FreshnessBadge } from "@/components/match-center/freshness-badge"
import { ProviderSourceNote } from "@/components/match-center/provider-source-note"
import { UnavailablePanel } from "@/components/match-center/unavailable-panel"

function ChannelRow({ channel }: { channel: MatchTvChannel }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
      {channel.logo ? (
        <div className="relative h-9 w-16 shrink-0 overflow-hidden rounded bg-muted">
          <Image
            src={channel.logo}
            alt={channel.name}
            fill
            className="object-contain p-1"
            unoptimized
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
          />
        </div>
      ) : (
        <div className="flex h-9 w-16 shrink-0 items-center justify-center rounded bg-muted">
          <Tv className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{channel.name}</p>
        {channel.country && (
          <p className="text-xs text-muted-foreground">{channel.country}</p>
        )}
      </div>
    </div>
  )
}

function TvSkeleton() {
  return (
    <div className="space-y-3 p-4" aria-busy="true" aria-label="Loading TV listings">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  )
}

interface MatchTvProps {
  envelope?: MatchIntelligenceEnvelope<MatchTvInfo> | null
  isLoading?: boolean
}

export function MatchTv({ envelope, isLoading }: MatchTvProps) {
  if (isLoading) return <TvSkeleton />

  if (!envelope || !envelope.data) {
    return (
      <UnavailablePanel
        title="TV listings not available"
        message={
          envelope?.unavailableReason ??
          "Broadcaster information is not currently available for this event. TV listings depend on provider coverage and are not available for all competitions."
        }
      />
    )
  }

  const { channels } = envelope.data

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Where to Watch</h3>
        <FreshnessBadge freshness={envelope.freshness} />
      </div>

      {channels.length === 0 ? (
        <UnavailablePanel
          title="No broadcaster information"
          message="We have no channel data for this event at this time."
        />
      ) : (
        <div className="space-y-2">
          {channels.map((ch, i) => (
            <ChannelRow key={ch.id ?? `ch-${i}`} channel={ch} />
          ))}
        </div>
      )}

      <ProviderSourceNote source={envelope.source} />
    </div>
  )
}
