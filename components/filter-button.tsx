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

export function FilterButton() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const dragStartPos = useRef({ x: 0, y: 0 })

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
            className={`fixed z-10 touch-none ${showDelete ? "animate-wiggle" : ""}`}
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
              cursor: isDragging ? "grabbing" : "grab",
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
          >
            <button
              className="flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 shadow-lg hover:bg-accent active:scale-95 transition-transform"
              onClick={(e) => {
                if (isDragging) {
                  e.preventDefault()
                  e.stopPropagation()
                } else {
                  triggerHaptic("light")
                }
              }}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="font-medium">Filter & Sort</span>
            </button>
          </div>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Filter & Sort</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-6 overflow-y-auto pb-8">
            <div>
              <h3 className="mb-3 font-semibold">Sport</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">Football</Button>
                <Button variant="outline" size="sm">Basketball</Button>
                <Button variant="outline" size="sm">Tennis</Button>
              </div>
            </div>
            <div>
              <h3 className="mb-3 font-semibold">Country</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">UK</Button>
                <Button variant="outline" size="sm">Spain</Button>
                <Button variant="outline" size="sm">Italy</Button>
              </div>
            </div>
            <div>
              <h3 className="mb-3 font-semibold">League</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">Premier League</Button>
                <Button variant="outline" size="sm">Champions League</Button>
                <Button variant="outline" size="sm">La Liga</Button>
              </div>
            </div>
            <div>
              <h3 className="mb-3 font-semibold">Date</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">Today</Button>
                <Button variant="outline" size="sm">Tomorrow</Button>
                <Button variant="outline" size="sm">This Week</Button>
              </div>
            </div>

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
