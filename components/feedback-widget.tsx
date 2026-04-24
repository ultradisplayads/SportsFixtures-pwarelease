"use client"

import { useState } from "react"
import { MessageSquarePlus, X, Star, ChevronRight, Check } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { useToast } from "@/hooks/use-toast"

const QUICK_TAGS = [
  "Live scores", "Search", "Fixtures", "TV guide",
  "Venues", "Notifications", "Design", "Performance",
]

export function FeedbackWidget() {
  const { isAuthenticated, user } = useAuth()
  const { toast } = useToast()
  const [open, setOpen]         = useState(false)
  const [score, setScore]       = useState(75)
  const [tags, setTags]         = useState<string[]>([])
  const [comment, setComment]   = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]         = useState(false)

  if (!isAuthenticated) return null

  const toggleTag = (tag: string) => {
    triggerHaptic("selection")
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const scoreLabel = score >= 80 ? "Loving it" : score >= 60 ? "Pretty good" : score >= 40 ? "It's ok" : "Needs work"
  const scoreColour = score >= 80 ? "text-green-600 dark:text-green-400"
    : score >= 60 ? "text-blue-600 dark:text-blue-400"
    : score >= 40 ? "text-amber-600 dark:text-amber-400"
    : "text-red-600 dark:text-red-400"

  const handleSubmit = async () => {
    triggerHaptic("medium")
    setSubmitting(true)
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score,
          tags,
          comment: comment.trim(),
          userId: user?.id,
          email: user?.email,
          page: typeof window !== "undefined" ? window.location.pathname : "/",
        }),
      })
      setDone(true)
      triggerHaptic("success")
      setTimeout(() => { setOpen(false); setDone(false); setScore(75); setTags([]); setComment("") }, 1800)
    } catch {
      toast({ title: "Couldn't send feedback", description: "Please try again", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => { setOpen(true); triggerHaptic("light") }}
        className="fixed bottom-24 right-4 z-40 flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-all active:scale-95"
        aria-label="Give feedback"
      >
        <MessageSquarePlus className="h-4 w-4" />
        Feedback
      </button>

      {/* Sheet overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-md mx-auto rounded-t-2xl border border-border bg-background p-5 pb-8 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            {done ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
                  <Check className="h-7 w-7 text-green-500" />
                </div>
                <p className="text-base font-semibold">Thanks for the feedback!</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <p className="text-base font-semibold">How are we doing?</p>
                  <button onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-muted">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Score slider */}
                <div className="mb-5">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Overall score</span>
                    <span className={`text-2xl font-bold tabular-nums ${scoreColour}`}>{score}</span>
                  </div>
                  <input
                    type="range" min={0} max={100} step={1} value={score}
                    onChange={e => setScore(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">Needs work</span>
                    <span className={`text-xs font-medium ${scoreColour}`}>{scoreLabel}</span>
                    <span className="text-[10px] text-muted-foreground">Loving it</span>
                  </div>
                </div>

                {/* Quick tags */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2">What stood out? (optional)</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_TAGS.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors
                          ${tags.includes(tag)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:bg-accent"
                          }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Anything else? (optional)"
                  rows={2}
                  className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none mb-4"
                />

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {submitting ? "Sending..." : "Send feedback"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
