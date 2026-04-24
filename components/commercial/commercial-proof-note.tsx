export function CommercialProofNote({ campaignCount }: { campaignCount: number }) {
  if (campaignCount <= 0) return null

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/65">
      {campaignCount} live campaign item{campaignCount === 1 ? "" : "s"} loaded for this placement.
    </div>
  )
}
