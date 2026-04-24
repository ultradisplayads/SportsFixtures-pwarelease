"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, ChevronLeft, Check, Bell, Zap, Shield, Crown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLocation } from "@/components/location-provider"
import { triggerHaptic } from "@/lib/haptic-feedback"
import Link from "next/link"
import Image from "next/image"
import { SmartLogo } from "@/components/assets/smart-logo"

interface Team {
  id: string
  name: string
  badge: string
  type: "club" | "country"
  sport: string
  country?: string
  priority?: number // lower = higher in list
}

// Teams always shown in suggested — Celtic pinned at position 0
const SUGGESTED_TEAMS: Team[] = [
  { id: "133714", name: "Celtic FC",           badge: "/celtic-logo.png",         type: "club",    sport: "Soccer",   country: "Scotland",  priority: 0 },
  { id: "133616", name: "Liverpool",            badge: "/liverpool-logo.png",      type: "club",    sport: "Soccer",   country: "England",   priority: 1 },
  { id: "133604", name: "Arsenal",              badge: "/arsenal-logo.png",        type: "club",    sport: "Soccer",   country: "England",   priority: 2 },
  { id: "133613", name: "Manchester United",    badge: "/man-utd-logo.png",        type: "club",    sport: "Soccer",   country: "England",   priority: 3 },
  { id: "133601", name: "Barcelona",            badge: "/barcelona-logo.png",      type: "club",    sport: "Soccer",   country: "Spain",     priority: 4 },
  { id: "133600", name: "Real Madrid",          badge: "/real-madrid-logo.png",    type: "club",    sport: "Soccer",   country: "Spain",     priority: 5 },
  { id: "133615", name: "Manchester City",      badge: "/man-city-logo.png",       type: "club",    sport: "Soccer",   country: "England",   priority: 6 },
  { id: "133712", name: "Rangers FC",           badge: "/rangers-logo.png",        type: "club",    sport: "Soccer",   country: "Scotland",  priority: 7 },
  { id: "134869", name: "Los Angeles Lakers",   badge: "/lakers-logo.png",         type: "club",    sport: "Basketball", country: "USA",    priority: 8 },
  { id: "134868", name: "Golden State Warriors",badge: "/warriors-logo.png",       type: "club",    sport: "Basketball", country: "USA",    priority: 9 },
  { id: "134920", name: "Kansas City Chiefs",   badge: "/chiefs-logo.png",         type: "club",    sport: "American Football", country: "USA", priority: 10 },
  { id: "135780", name: "India Cricket",        badge: "/india-cricket-logo.png",  type: "country", sport: "Cricket",            priority: 11 },
  { id: "135781", name: "England Cricket",      badge: "/england-cricket-logo.png",type: "country", sport: "Cricket",            priority: 12 },
  { id: "rugby-nz", name: "All Blacks",         badge: "/all-blacks-logo.png",     type: "country", sport: "Rugby",              priority: 13 },
]

// Local teams by country — shown under "Local" tab when location is Thailand
const LOCAL_TEAMS_BY_COUNTRY: Record<string, Team[]> = {
  thailand: [
    { id: "134178", name: "Buriram United",     badge: "/buriram-logo.png",        type: "club",    sport: "Soccer",   country: "Thailand" },
    { id: "134179", name: "Muang Thong United", badge: "/muang-thong-logo.png",    type: "club",    sport: "Soccer",   country: "Thailand" },
    { id: "134180", name: "Chiang Rai United",  badge: "/chiang-rai-logo.png",     type: "club",    sport: "Soccer",   country: "Thailand" },
    { id: "134181", name: "BG Pathum United",   badge: "/bg-pathum-logo.png",      type: "club",    sport: "Soccer",   country: "Thailand" },
    { id: "134182", name: "Port FC",            badge: "/port-fc-logo.png",        type: "club",    sport: "Soccer",   country: "Thailand" },
    { id: "134183", name: "Ratchaburi FC",      badge: "/ratchaburi-logo.png",     type: "club",    sport: "Soccer",   country: "Thailand" },
    { id: "134184", name: "PTT Rayong",         badge: "/ptt-rayong-logo.png",     type: "club",    sport: "Soccer",   country: "Thailand" },
    { id: "th-national", name: "Thailand National", badge: "/thailand-flag.png",   type: "country", sport: "Soccer" },
  ],
  scotland: [
    { id: "133714", name: "Celtic FC",   badge: "/celtic-logo.png",  type: "club", sport: "Soccer", country: "Scotland" },
    { id: "133712", name: "Rangers FC",  badge: "/rangers-logo.png", type: "club", sport: "Soccer", country: "Scotland" },
    { id: "133720", name: "Hearts",      badge: "/hearts-logo.png",  type: "club", sport: "Soccer", country: "Scotland" },
    { id: "133721", name: "Hibernian",   badge: "/hibs-logo.png",    type: "club", sport: "Soccer", country: "Scotland" },
    { id: "133722", name: "Aberdeen",    badge: "/aberdeen-logo.png",type: "club", sport: "Soccer", country: "Scotland" },
  ],
  england: [
    { id: "133616", name: "Liverpool",         badge: "/liverpool-logo.png",   type: "club", sport: "Soccer", country: "England" },
    { id: "133604", name: "Arsenal",           badge: "/arsenal-logo.png",     type: "club", sport: "Soccer", country: "England" },
    { id: "133613", name: "Manchester United", badge: "/man-utd-logo.png",     type: "club", sport: "Soccer", country: "England" },
    { id: "133615", name: "Manchester City",   badge: "/man-city-logo.png",    type: "club", sport: "Soccer", country: "England" },
    { id: "133610", name: "Chelsea",           badge: "/chelsea-logo.png",     type: "club", sport: "Soccer", country: "England" },
    { id: "133612", name: "Tottenham Hotspur", badge: "/spurs-logo.png",       type: "club", sport: "Soccer", country: "England" },
  ],
}

// Detect country from browser timezone (no UTC — use locale only)
function detectLocalCountry(): string {
  if (typeof window === "undefined") return "england"
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (tz.startsWith("Asia/Bangkok") || tz.startsWith("Asia/Phnom_Penh")) return "thailand"
    if (tz.startsWith("Europe/Edinburgh") || tz.startsWith("Europe/Glasgow")) return "scotland"
    if (tz.startsWith("Europe/London") || tz.startsWith("Europe/Belfast")) return "england"
    if (tz.startsWith("Europe/Madrid")) return "spain"
    if (tz.startsWith("Europe/Berlin")) return "germany"
    if (tz.startsWith("Europe/Rome")) return "italy"
    if (tz.startsWith("Europe/Paris")) return "france"
  } catch {}
  return "england"
}

const PAGES = ["notification-types", "follow-teams", "subscription", "complete"] as const
type Page = (typeof PAGES)[number]

export default function FollowTeamsPage() {
  const router = useRouter()
  const { location, requestLocation } = useLocation()
  const [activeTab, setActiveTab] = useState<"local" | "suggested">("suggested")
  const [searchQuery, setSearchQuery] = useState("")
  const [followedTeams, setFollowedTeams] = useState<Set<string>>(new Set(["133714"])) // Celtic pre-followed
  const [currentPage, setCurrentPage] = useState<Page>("follow-teams")
  const [localCountry, setLocalCountry] = useState<string>("england")
  const [notifPrefs, setNotifPrefs] = useState({
    matchStart: true,
    goals: true,
    halftime: false,
    fulltime: true,
    cards: false,
    lineups: false,
    advertising: false,
    venueOffers: false,
  })

  useEffect(() => {
    const saved = localStorage.getItem("followedTeams")
    if (saved) {
      const parsed = new Set<string>(JSON.parse(saved))
      parsed.add("133714") // Always keep Celtic
      setFollowedTeams(parsed)
    }
    if (!location) requestLocation()
    const country = detectLocalCountry()
    setLocalCountry(country)
  }, [])

  const localTeams = LOCAL_TEAMS_BY_COUNTRY[localCountry] || LOCAL_TEAMS_BY_COUNTRY["england"]

  const displayTeams = activeTab === "local" ? localTeams : SUGGESTED_TEAMS
  const filteredTeams = displayTeams.filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const toggleFollow = (teamId: string) => {
    if (teamId === "133714") return // Celtic is always followed
    triggerHaptic("selection")
    const next = new Set(followedTeams)
    next.has(teamId) ? next.delete(teamId) : next.add(teamId)
    setFollowedTeams(next)
    localStorage.setItem("followedTeams", JSON.stringify([...next]))
  }

  const toggleNotif = (key: keyof typeof notifPrefs) => {
    triggerHaptic("light")
    setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleNext = async () => {
    triggerHaptic("light")
    const idx = PAGES.indexOf(currentPage)
    if (idx < PAGES.length - 1) {
      if (currentPage === "follow-teams") {
        // Save prefs before advancing
        localStorage.setItem("followedTeams", JSON.stringify([...followedTeams]))
      }
      setCurrentPage(PAGES[idx + 1])
    } else {
      // Request push permission then finish
      if ("Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission()
      }
      localStorage.setItem("onboardingComplete", "true")
      localStorage.setItem("notifPrefs", JSON.stringify(notifPrefs))
      triggerHaptic("success")

      // Persist followed teams to DB (fire-and-forget — localStorage is fallback if offline/unauthed)
      if (followedTeams.size > 0) {
        const teams = Array.from(followedTeams)
        fetch("/api/favourites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teams }),
        }).catch(() => {})
      }

      router.push("/")
    }
  }

  const handleBack = () => {
    triggerHaptic("light")
    const idx = PAGES.indexOf(currentPage)
    if (idx > 0) setCurrentPage(PAGES[idx - 1])
    else router.push("/onboarding")
  }

  const pageIndex = PAGES.indexOf(currentPage)
  const totalPages = PAGES.length

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <button onClick={handleBack} className="rounded-full p-2 hover:bg-accent">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-base font-bold">
          {currentPage === "follow-teams" && "Follow Teams"}
          {currentPage === "notification-types" && "Notifications"}
          {currentPage === "subscription" && "Choose Your Plan"}
          {currentPage === "complete" && "All Set!"}
        </h1>
        <div className="w-10" />
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 py-3">
        {PAGES.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all ${i === pageIndex ? "w-8 bg-primary h-2" : "w-2 h-2 bg-muted"}`}
          />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">

        {/* ── Notification types page ── */}
        {currentPage === "notification-types" && (
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground text-balance">
              Choose which updates you want pushed to your device. You can change these any time in Settings.
            </p>

            <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
              {([
                { key: "matchStart",   label: "Match Start",    desc: "Notified when your teams kick off" },
                { key: "goals",        label: "Goals",          desc: "Instant alert for every goal" },
                { key: "halftime",     label: "Half Time",      desc: "Score update at the break" },
                { key: "fulltime",     label: "Full Time",      desc: "Final score as soon as the whistle blows" },
                { key: "cards",        label: "Cards",          desc: "Yellow and red card alerts" },
                { key: "lineups",      label: "Team Lineups",   desc: "When confirmed line-ups are published" },
                { key: "venueOffers",  label: "Venue Offers",   desc: "Local bar and venue promotions near you" },
                { key: "advertising",  label: "Partner Offers", desc: "Deals from Sports Fixtures partners" },
              ] as { key: keyof typeof notifPrefs; label: string; desc: string }[]).map(({ key, label, desc }) => (
                <button
                  key={key}
                  onClick={() => toggleNotif(key)}
                  className="flex w-full items-center justify-between p-4 text-left hover:bg-accent/40 transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <div className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${notifPrefs[key] ? "bg-primary" : "bg-muted"}`}>
                    <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${notifPrefs[key] ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                </button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              We&apos;ll only push notifications you choose above. No spam, ever.
            </p>
          </div>
        )}

        {/* ── Follow teams page ── */}
        {currentPage === "follow-teams" && (
          <>
            <p className="mb-4 mt-2 text-sm text-muted-foreground text-balance">
              Follow teams to get timezone-accurate fixtures, TV listings, and notifications. Celtic FC is always featured.
            </p>

            <div className="mb-4 flex border-b border-border">
              {(["suggested", "local"] as const).map((tab) => (
                <button
                  key={tab}
                  className={`flex-1 pb-3 text-center text-sm font-semibold transition-colors capitalize ${
                    activeTab === tab ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
                  }`}
                  onClick={() => { setActiveTab(tab); triggerHaptic("selection") }}
                >
                  {tab === "local" ? `Local (${localCountry.replace("-", " ")})` : "Suggested"}
                </button>
              ))}
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search teams, sports..."
                className="pl-9 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              {filteredTeams.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No teams found</p>
              ) : (
                filteredTeams.map((team) => {
                  const isCeltic = team.id === "133714"
                  const isFollowed = followedTeams.has(team.id)
                  return (
                    <div
                      key={team.id}
                      className={`flex items-center justify-between rounded-xl border bg-card p-3 shadow-sm transition-all ${
                        isCeltic ? "border-primary/40" : "border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <SmartLogo
                          name={team.name}
                          src={team.badge || null}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                        <div>
                          <div className="text-sm font-semibold">{team.name}{isCeltic && <span className="ml-2 text-[10px] font-medium text-primary bg-primary/10 rounded-full px-1.5 py-0.5">Featured</span>}</div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>{team.sport}</span>
                            {team.country && <><span>·</span><span>{team.country}</span></>}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFollow(team.id)}
                        disabled={isCeltic}
                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                          isFollowed
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground hover:border-primary"
                        }`}
                      >
                        {isFollowed && <Check className="h-4 w-4" />}
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}

        {/* ── Subscription page ── */}
        {currentPage === "subscription" && (
          <div className="space-y-4 mt-1 pb-2">

            {/* Quirk hero banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 px-4 pt-3 pb-4">
              {/* Animated shimmer ring */}
              <div className="absolute inset-0 rounded-2xl pointer-events-none">
                <div className="absolute inset-0 rounded-2xl animate-pulse bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0" />
              </div>

              <div className="flex items-end gap-3">
                {/* Quirk */}
                <div className="relative shrink-0 animate-[bounce_2s_ease-in-out_infinite]">
                  <Image
                    src="/quirk.png"
                    alt="Quirk the Sports Fixtures mascot"
                    width={88}
                    height={88}
                    className="drop-shadow-lg"
                    priority
                  />
                  {/* Speech bubble */}
                  <div className="absolute -top-1 -right-2 bg-primary text-primary-foreground text-[9px] font-black rounded-full px-1.5 py-0.5 leading-tight rotate-6 shadow-md whitespace-nowrap">
                    Psst!
                  </div>
                </div>

                {/* Message */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-0.5">Limited time</p>
                  <h3 className="text-xl font-black leading-tight text-balance text-foreground">
                    Pick Bronze,<br />get Gold FREE!
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Every new user gets the{" "}
                    <span className="font-bold text-foreground">Gold Launch Pass</span>{" "}
                    until 31 Dec — no catch, no card needed.
                  </p>
                </div>
              </div>

              {/* Flashing countdown pill */}
              <div className="mt-3 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                </span>
                <span className="animate-pulse text-xs font-bold text-primary tracking-wide">
                  FREE until 31 Dec 2025 — Gold features unlocked now
                </span>
              </div>
            </div>

            {/* Plan cards */}
            {([
              {
                id: "bronze",
                name: "Bronze",
                icon: <Shield className="h-4 w-4" />,
                iconColor: "text-amber-600",
                price: "Free",
                sub: "always",
                highlight: false,
                quirk: "Good for starters",
                features: [
                  "Core fixtures, results and live scores",
                  "Basic match alerts (up to 3 teams)",
                  "Venue discovery",
                  "Full fixture calendar",
                ],
              },
              {
                id: "silver",
                name: "Silver",
                icon: <Zap className="h-4 w-4" />,
                iconColor: "text-slate-400",
                price: "£1.99",
                sub: "/month",
                highlight: false,
                badge: "Founder pricing — locked in at launch",
                quirk: "The sweet spot",
                features: [
                  "Everything in Bronze",
                  "Unlimited match alerts and reminders",
                  "Deeper personalisation",
                  "Multi-device sync",
                  "Reduced ad load",
                ],
              },
              {
                id: "gold",
                name: "Gold",
                icon: <Crown className="h-4 w-4" />,
                iconColor: "text-yellow-500",
                price: "£2.99",
                sub: "/month",
                highlight: true,
                badge: "FREE until 31 Dec with Launch Pass",
                quirk: "Quirk's favourite!",
                features: [
                  "Everything in Silver",
                  "Ad-free experience",
                  "All alert windows (5 min to 24h)",
                  "Premium venue and watch tools",
                  "Export your data",
                  "Priority support",
                ],
              },
            ]).map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 overflow-hidden transition-all ${
                  plan.highlight
                    ? "border-primary shadow-[0_0_24px_rgba(var(--primary-rgb)/0.25)]"
                    : "border-border"
                }`}
              >
                {/* Gold animated glow border */}
                {plan.highlight && (
                  <div className="absolute inset-0 rounded-2xl pointer-events-none animate-pulse bg-gradient-to-b from-primary/8 to-transparent" />
                )}

                {/* "Quirk recommends" flag */}
                {plan.highlight && (
                  <div className="flex items-center gap-1.5 bg-primary px-4 py-1.5">
                    <Image src="/quirk.png" alt="" width={18} height={18} className="shrink-0" />
                    <span className="text-[11px] font-black tracking-wide text-primary-foreground uppercase">
                      Quirk says — start here, it&apos;s free!
                    </span>
                  </div>
                )}

                <div className="p-4">
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={plan.iconColor}>{plan.icon}</span>
                        <p className="font-black text-base">{plan.name}</p>
                        <span className="text-[9px] italic text-muted-foreground">"{plan.quirk}"</span>
                      </div>
                      {plan.badge && (
                        <div className="mt-0.5 flex items-center gap-1">
                          {plan.highlight && (
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                            </span>
                          )}
                          <p className={`text-[10px] font-bold ${plan.highlight ? "text-primary animate-pulse" : "text-primary"}`}>
                            {plan.badge}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <div className="flex items-baseline gap-0.5">
                        <span className={`font-black text-lg ${plan.highlight ? "text-primary" : ""}`}>
                          {plan.price}
                        </span>
                        {plan.sub && (
                          <span className="text-xs text-muted-foreground">{plan.sub}</span>
                        )}
                      </div>
                      {plan.highlight && (
                        <p className="text-[9px] font-bold text-primary">FREE now</p>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-1.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className={`h-3 w-3 shrink-0 ${plan.highlight ? "text-primary" : "text-primary/70"}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}

            {/* Footer nudge with Quirk */}
            <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2.5">
              <Image src="/quirk.png" alt="" width={28} height={28} className="shrink-0" />
              <p className="text-xs text-muted-foreground leading-snug">
                <span className="font-semibold text-foreground">No billing until Jan 2026.</span>{" "}
                You&apos;ll get a heads-up before anything changes. Quirk promises.
              </p>
            </div>
          </div>
        )}

        {/* ── Complete page ── */}
        {currentPage === "complete" && (
          <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Bell className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">You&apos;re all set!</h2>
              <p className="text-sm text-muted-foreground text-balance max-w-xs">
                Timezone-accurate fixtures, live scores, and push notifications are ready. Celtic FC is always in your feed.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-background p-4">
        <Button
          size="lg"
          className="h-12 w-full rounded-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
          onClick={handleNext}
        >
          {currentPage === "complete" ? "Go to Fixtures" : "Continue"}
        </Button>
      </div>
    </div>
  )
}
