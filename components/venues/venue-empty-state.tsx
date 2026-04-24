import { MapPin } from "lucide-react"
import Link from "next/link"

interface Props {
  mode: "event" | "nearby" | "followed"
}

const COPY: Record<Props["mode"], { title: string; body: string }> = {
  event: {
    title: "No places to watch found",
    body: "No venues were found for this event right now. Try browsing nearby venues.",
  },
  nearby: {
    title: "No venues matched your filters",
    body: "Try adjusting your distance or removing some filters.",
  },
  followed: {
    title: "No followed venues",
    body: "You are not following any venues yet. Browse nearby venues to get started.",
  },
}

export function VenueEmptyState({ mode }: Props) {
  const { title, body } = COPY[mode]

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-muted/30 px-5 py-8 text-center">
      <MapPin className="h-8 w-8 text-muted-foreground" />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
      {mode !== "nearby" && (
        <Link
          href="/venues"
          className="mt-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Browse Venues
        </Link>
      )}
    </div>
  )
}
