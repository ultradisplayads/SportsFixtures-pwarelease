"use client"

export type GoalCelebrationMood = "for" | "against" | "neutral"

export type GoalCelebrationDetail = {
  matchId: string
  teamName: string
  opponentName: string
  homeTeam: string
  awayTeam: string
  score: string
  mood: GoalCelebrationMood
  primaryColor: string
  secondaryColor: string
}

export const GOAL_CELEBRATION_EVENT = "sf:goal-celebration"
let lastDispatchKey = ""
let lastDispatchAt = 0

const TEAM_PALETTE: Array<[string, string]> = [
  ["#16a34a", "#ffffff"],
  ["#2563eb", "#ffffff"],
  ["#dc2626", "#ffffff"],
  ["#facc15", "#111827"],
  ["#7c3aed", "#ffffff"],
  ["#ea580c", "#ffffff"],
  ["#0891b2", "#ffffff"],
  ["#be123c", "#ffffff"],
  ["#0f766e", "#ffffff"],
  ["#4338ca", "#ffffff"],
]

function hash(input: string): number {
  return [...input].reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 7)
}

export function coloursForTeam(teamName: string): [string, string] {
  return TEAM_PALETTE[hash(teamName) % TEAM_PALETTE.length]
}

export function dispatchGoalCelebration(detail: GoalCelebrationDetail) {
  if (typeof window === "undefined") return
  const key = `${detail.matchId}:${detail.score}:${detail.teamName}`
  const now = Date.now()
  if (key === lastDispatchKey && now - lastDispatchAt < 8000) return
  lastDispatchKey = key
  lastDispatchAt = now
  window.dispatchEvent(new CustomEvent<GoalCelebrationDetail>(GOAL_CELEBRATION_EVENT, { detail }))
}
