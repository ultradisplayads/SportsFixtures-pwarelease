const revision =
  process.env.NEXT_PUBLIC_REVISION ||
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
  "local-dev"

const updatedAt = process.env.NEXT_PUBLIC_BUILD_TIME || "2026-05-07 local"

export function BuildIdentity() {
  return (
    <div className="fixed bottom-2 right-2 z-[90] rounded-md border border-border/80 bg-background/92 px-2.5 py-1.5 text-[10px] leading-tight text-foreground shadow-sm backdrop-blur">
      <div className="font-semibold">SportsFixtures PWA canonical</div>
      <div>rev {revision}</div>
      <div>updated {updatedAt}</div>
    </div>
  )
}
