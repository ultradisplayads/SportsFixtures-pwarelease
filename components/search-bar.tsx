"use client"

import type React from "react"
import type { ReactNode } from "react"

import { Search, X } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { analytics } from "@/lib/analytics"

export function SearchBar({ actions }: { actions?: ReactNode }) {
  const [query, setQuery] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      analytics.search(query.trim(), 0, "global_header")
      triggerHaptic("light")
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleClear = () => {
    triggerHaptic("light")
    setQuery("")
  }

  return (
    <div className="border-b border-border bg-card px-3 py-2.5 sm:px-4">
      <div className="flex flex-wrap items-center gap-2">
        <form onSubmit={handleSearch} className="min-w-[220px] flex-1">
        <div
          className={`flex items-center gap-2.5 rounded-lg bg-accent px-3.5 py-2.5 transition-all ${
            isFocused ? "ring-2 ring-primary/20" : ""
          }`}
        >
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search sports, fixtures, venues, offers..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button type="button" onClick={handleClear} className="rounded-full p-0.5 hover:bg-muted">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </form>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2 overflow-x-auto scrollbar-hide">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  )
}
