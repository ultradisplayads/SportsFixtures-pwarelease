"use client"

import type React from "react"

import { SlidersHorizontal, X } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useState, useRef, useEffect } from "react"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { ThemeToggle } from "@/components/theme-toggle"
import { HomeModuleEditor } from "@/components/personalized-home"
import { TimezoneSelector } from "@/components/timezone-selector"
import { useFixturesFilter } from "@/lib/fixtures-filter-context"

type DirectoryItem = {
  id: string
  label: string
  slug: string
}

function ChipGroup({
  title,
  items,
  active,
  loading,
  onSelect,
}: {
  title: string
  items: DirectoryItem[]
  active?: string | null
  loading?: boolean
  onSelect?: (item: DirectoryItem) => void
}) {
  return (
    <div>
      <h3 className="mb-3 font-semibold">{title}</h3>
      <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto pr-1">
        {loading ? (
          <Button variant="outline" size="sm" disabled>Loading...</Button>
        ) : items.length > 0 ? (
          items.map((item) => {
            const isActive = active === item.slug || active === item.id
            return (
              <Button
                key={`${title}-${item.id}`}
                type="button"
                variant={isActive ? "default" : "outline"}
                size="sm"
                className="max-w-full truncate"
                title={item.label}
                onClick={() => onSelect?.(item)}
              >
                {item.label}
              </Button>
            )
          })
        ) : (
          <Button variant="outline" size="sm" disabled>No {title.toLowerCase()} found</Button>
        )}
      </div>
    </div>
  )
}

export function FilterButton() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [sports, setSports] = useState<DirectoryItem[]>([])
  const [countries, setCountries] = useState<DirectoryItem[]>([])
  const [leagues, setLeagues] = useState<DirectoryItem[]>([])
  const [competitions, setCompetitions] = useState<DirectoryItem[]>([])
  const [isDirectoryLoading, setIsDirectoryLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState("today")
  const { selectedSport, selectedCountry, pinnedLeagueId, setSport, setCountry, setPinnedLeague } = useFixturesFilter()
  const buttonRef = useRef<HTMLDivElement>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const dragStartPos = useRef({ x: 0, y: 0 })

  const selectedSportId = sports.find((item) => item.slug === selectedSport || item.id === selectedSport)?.id
  const selectedCountryName = countries.find((item) => item.slug === selectedCountry || item.id === selectedCountry)?.label

  useEffect(() => {
    const initPosition = () => {
      if (buttonRef.current) {
        const viewportWidth = window.innerWidth
        const buttonWidth = buttonRef.current.offsetWidth
        const viewportHeight = window.innerHeight

        setPosition({
          x: (viewportWidth - buttonWidth) / 2,
          y: viewportHeight - 160,
        })
      }
    }

    initPosition()
    const onResize = () => initPosition()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadDirectory() {
      setIsDirectoryLoading(true)
      try {
        const [sportsRes, countriesRes] = await Promise.all([
          fetch("/api/sports"),
          fetch("/api/countries"),
        ])
        const [sportsJson, countriesJson] = await Promise.all([
          sportsRes.json(),
          countriesRes.json(),
        ])

        if (!cancelled) {
          setSports(Array.isArray(sportsJson.sports) ? sportsJson.sports : [])
          setCountries(Array.isArray(countriesJson.countries) ? countriesJson.countries : [])
        }
      } catch (error) {
        console.error("[FilterButton] Failed to load directory", error)
      } finally {
        if (!cancelled) setIsDirectoryLoading(false)
      }
    }

    loadDirectory()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const query = new URLSearchParams()
    if (selectedSportId) query.set("sportId", selectedSportId)
    if (selectedCountryName) query.set("country", selectedCountryName)

    async function loadCompetitions() {
      try {
        const suffix = query.toString() ? `?${query}` : ""
        const [leaguesRes, competitionsRes] = await Promise.all([
          fetch(`/api/leagues${suffix}`),
          fetch(`/api/competitions${suffix}`),
        ])
        const [leaguesJson, competitionsJson] = await Promise.all([
          leaguesRes.json(),
          competitionsRes.json(),
        ])

        if (!cancelled) {
          setLeagues(Array.isArray(leaguesJson.leagues) ? leaguesJson.leagues : [])
          setCompetitions(Array.isArray(competitionsJson.competitions) ? competitionsJson.competitions : [])
        }
      } catch (error) {
        console.error("[FilterButton] Failed to load competitions", error)
        if (!cancelled) {
          setLeagues([])
          setCompetitions([])
        }
      }
    }

    loadCompetitions()
    return () => {
      cancelled = true
    }
  }, [selectedSportId, selectedCountryName])

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    dragStartPos.current = { x: touch.clientX - position.x, y: touch.clientY - position.y }

    longPressTimer.current = setTimeout(() => {
      triggerHaptic("medium")
      setShowDelete(true)
    }, 500)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    clearTimeout(longPressTimer.current)
    setIsDragging(true)
    const touch = e.touches[0]

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const buttonWidth = buttonRef.current?.offsetWidth || 0
    const buttonHeight = buttonRef.current?.offsetHeight || 0

    let newX = touch.clientX - dragStartPos.current.x
    let newY = touch.clientY - dragStartPos.current.y

    newX = Math.max(0, Math.min(newX, viewportWidth - buttonWidth))
    newY = Math.max(0, Math.min(newY, viewportHeight - buttonHeight))

    setPosition({ x: newX, y: newY })
  }

  const handleTouchEnd = () => {
    clearTimeout(longPressTimer.current)
    setTimeout(() => setIsDragging(false), 100)
    setShowDelete(false)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    dragStartPos.current = { x: e.clientX - position.x, y: e.clientY - position.y }

    longPressTimer.current = setTimeout(() => {
      triggerHaptic("medium")
      setShowDelete(true)
    }, 500)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (e.buttons !== 1) return
    clearTimeout(longPressTimer.current)
    setIsDragging(true)

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const buttonWidth = buttonRef.current?.offsetWidth || 0
    const buttonHeight = buttonRef.current?.offsetHeight || 0

    let newX = e.clientX - dragStartPos.current.x
    let newY = e.clientY - dragStartPos.current.y

    newX = Math.max(0, Math.min(newX, viewportWidth - buttonWidth))
    newY = Math.max(0, Math.min(newY, viewportHeight - buttonHeight))

    setPosition({ x: newX, y: newY })
  }

  const handleMouseUp = () => {
    clearTimeout(longPressTimer.current)
    setTimeout(() => setIsDragging(false), 100)
    setShowDelete(false)
  }

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [position])

  const handleDelete = () => {
    triggerHaptic("heavy")
    // Hide the filter button temporarily
    if (buttonRef.current) {
      buttonRef.current.style.display = "none"
      setTimeout(() => {
        if (buttonRef.current) buttonRef.current.style.display = "block"
      }, 3000)
    }
  }

  return (
    <>
      {showDelete && (
        <button
          onClick={handleDelete}
          className="fixed left-1/2 top-12 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-lg animate-in fade-in slide-in-from-top-2"
        >
          <X className="h-4 w-4" />
          Remove
        </button>
      )}

      <Sheet>
        <SheetTrigger asChild>
          <div
            ref={buttonRef}
            className={`fixed bottom-24 right-4 z-40 touch-none ${showDelete ? "animate-wiggle" : ""}`}
            style={{
              cursor: isDragging ? "grabbing" : "grab",
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
          >
            <button
              className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition-transform hover:bg-accent active:scale-95 sm:w-auto sm:px-4"
              onClick={(e) => {
                if (isDragging) {
                  e.preventDefault()
                  e.stopPropagation()
                } else {
                  triggerHaptic("light")
                }
              }}
              aria-label="Filter and sort"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden text-sm font-medium sm:inline">Filter</span>
            </button>
          </div>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Filter & Sort</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-6 overflow-y-auto pb-8">
            <ChipGroup
              title="Sport"
              items={sports}
              active={selectedSport}
              loading={isDirectoryLoading}
              onSelect={(item) => {
                triggerHaptic("selection")
                setSport(item.slug || item.id)
              }}
            />
            <ChipGroup
              title="Country"
              items={countries}
              active={selectedCountry}
              loading={isDirectoryLoading}
              onSelect={(item) => {
                triggerHaptic("selection")
                setCountry(item.slug || item.id)
              }}
            />
            <ChipGroup
              title="League"
              items={leagues}
              active={pinnedLeagueId}
              onSelect={(item) => {
                triggerHaptic("selection")
                setPinnedLeague(pinnedLeagueId === item.id ? null : item.id)
              }}
            />
            <ChipGroup
              title="Competitions"
              items={competitions}
              active={pinnedLeagueId}
              onSelect={(item) => {
                triggerHaptic("selection")
                setPinnedLeague(pinnedLeagueId === item.id ? null : item.id)
              }}
            />
            <ChipGroup
              title="Date"
              items={[
                { id: "today", label: "Today", slug: "today" },
                { id: "tomorrow", label: "Tomorrow", slug: "tomorrow" },
                { id: "week", label: "This Week", slug: "week" },
              ]}
              active={selectedDate}
              onSelect={(item) => setSelectedDate(item.slug)}
            />

            {/* ── Timezone ──────────────────────────── */}
            <div className="border-t border-border pt-4">
              <h3 className="mb-3 font-semibold">Display Timezone</h3>
              <TimezoneSelector />
            </div>

            {/* ── Home Layout ───────────────────────── */}
            <div className="border-t border-border pt-4">
              <HomeModuleEditor />
            </div>

            {/* ── Appearance ───────────────────────── */}
            <div className="border-t border-border pt-4">
              <ThemeToggle />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
