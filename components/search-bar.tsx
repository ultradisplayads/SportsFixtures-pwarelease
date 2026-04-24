"use client"

import type React from "react"

import { Search, X } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { triggerHaptic } from "@/lib/haptic-feedback"

export function SearchBar() {
  const [query, setQuery] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      triggerHaptic("light")
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleClear = () => {
    triggerHaptic("light")
    setQuery("")
  }

  return (
    <div className="border-b border-border bg-card px-4 py-2.5">
      <form onSubmit={handleSearch}>
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
            placeholder="Search teams, players, leagues..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button type="button" onClick={handleClear} className="rounded-full p-0.5 hover:bg-muted">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
