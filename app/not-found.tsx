import Link from "next/link"
import { SearchX } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <SearchX className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          The page you were looking for does not exist or may have moved.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground hover:bg-primary/90">Go home</Link>
          <Link href="/live" className="rounded-xl border border-border bg-card px-4 py-3 font-medium hover:bg-accent">Live scores</Link>
        </div>
      </div>
    </div>
  )
}
