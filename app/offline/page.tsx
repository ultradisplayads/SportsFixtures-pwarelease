import Link from "next/link"

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <h1 className="text-xl font-bold">You&apos;re offline</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Sports Fixtures needs a connection for live scores and fresh TV listings, but you can still reopen cached pages.
        </p>
        <div className="mt-6 grid gap-3">
          <Link className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground" href="/">
            Retry home
          </Link>
          <Link className="rounded-xl border border-border px-4 py-3 text-sm font-semibold" href="/fixtures">
            Open cached fixtures
          </Link>
          <a
            className="rounded-xl border border-border px-4 py-3 text-sm font-semibold"
            href={`${process.env.NEXT_PUBLIC_FULL_SITE_URL || "https://sportsfixtures.net"}/fixtures`}
          >
            Open full site
          </a>
        </div>
      </div>
    </main>
  )
}
