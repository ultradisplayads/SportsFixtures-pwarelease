import type { VenueOffer } from "@/types/venues"

interface Props {
  offers: VenueOffer[]
}

export function VenueOffersStrip({ offers }: Props) {
  if (!offers?.length) return null

  return (
    <div className="mb-3">
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Offers
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {offers.map((offer) => (
          <div
            key={offer.id}
            className="min-w-[200px] max-w-[240px] shrink-0 rounded-xl border border-primary/20 bg-primary/5 p-3"
          >
            <div className="text-sm font-semibold text-foreground">{offer.title}</div>
            {offer.description && (
              <div className="mt-0.5 text-xs text-muted-foreground">{offer.description}</div>
            )}
            {offer.validUntil && (
              <div className="mt-1.5 text-[10px] text-muted-foreground">
                Valid until {offer.validUntil}
              </div>
            )}
            {offer.sponsored && (
              <div className="mt-1 text-[10px] text-muted-foreground">Sponsored</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
