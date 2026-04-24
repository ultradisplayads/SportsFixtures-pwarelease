"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Route error:", error) }, [error])
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">This page hit a problem. Try again or head back to a stable section of the app.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button onClick={() => reset()} className="rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground hover:bg-primary/90">Try again</button>
          <Link href="/" className="rounded-xl border border-border bg-card px-4 py-3 font-medium hover:bg-accent">Go home</Link>
        </div>
      </div>
    </div>
  )
}
