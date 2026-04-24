import type { CommercialCard as CommercialCardType } from "@/types/monetization"
import { DisclosurePill } from "@/components/commercial/disclosure-pill"
import { ExternalLink } from "lucide-react"
import { ExternalLinkGuard } from "@/components/platform/external-link-guard"

interface CommercialCardProps {
  item: CommercialCardType
  className?: string
}

export function CommercialCard({ item, className = "" }: CommercialCardProps) {
  // Never render a card with no title — missing data must not produce dead UI
  if (!item.title) return null

  return (
    <article
      className={`rounded-2xl border border-border bg-card p-4 ${className}`}
      aria-label={item.title}
    >
      {/* Header row: title + disclosure */}
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold leading-snug text-foreground/90">{item.title}</p>
        <DisclosurePill disclosure={item.disclosure} />
      </div>

      {/* Body */}
      {item.body && (
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
      )}

      {/* Image */}
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt=""
          className="mt-3 h-32 w-full rounded-xl object-cover"
          loading="lazy"
        />
      )}

      {/* CTA */}
      {item.href && (
        <ExternalLinkGuard
          href={item.href}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-foreground/80 transition-colors hover:bg-accent"
        >
          Learn more
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </ExternalLinkGuard>
      )}

      {/* Sponsor attribution if present */}
      {item.sponsorName && (
        <p className="mt-2 text-[10px] text-muted-foreground/60">
          Presented by {item.sponsorName}
        </p>
      )}
    </article>
  )
}
