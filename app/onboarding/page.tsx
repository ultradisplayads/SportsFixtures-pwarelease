"use client"
import { useRouter } from "next/navigation"
import { ChevronRight, Globe, Clock, Tv, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LogoSquare } from "@/components/logo-badge"

export default function OnboardingPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary/10 to-background px-6">
      <div className="mb-8 flex flex-col items-center gap-3">
        <LogoSquare size={88} className="shadow-xl" />
        <span className="text-2xl font-black tracking-tight">Sports Fixtures</span>
        <span className="text-sm font-medium text-primary">sportsfixtures.net</span>
      </div>

      <h1 className="mb-4 text-balance text-center text-3xl font-bold leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
        Changing how you follow sport globally.
      </h1>

      <p className="mb-10 max-w-sm text-balance text-center text-base text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
        Time zone-accurate fixtures, TV listings, venue discovery, live scores, and alerts — all in one app.
      </p>

      <div className="mb-10 grid max-w-sm grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
        {[
          { icon: Globe,  label: "Global Coverage",   sub: "All sports worldwide" },
          { icon: Clock,  label: "Your Local Time",   sub: "Timezone-accurate kick-offs" },
          { icon: Tv,     label: "TV & Watch Guide",  sub: "Never miss a game" },
          { icon: MapPin, label: "Find Venues",       sub: "Discover nearby sports bars" },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="text-sm font-semibold">{label}</div>
            <div className="text-xs text-muted-foreground">{sub}</div>
          </div>
        ))}
      </div>

      <Button
        size="lg"
        className="mb-5 h-14 w-full max-w-sm rounded-full bg-primary text-base font-semibold shadow-lg hover:bg-primary/90 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500"
        onClick={() => router.push("/onboarding/follow-teams")}
      >
        Get Started
        <ChevronRight className="ml-2 h-5 w-5" />
      </Button>

      <div className="flex animate-in fade-in items-center gap-2 text-sm duration-1000 delay-700">
        <span className="text-muted-foreground">Already a user?</span>
        <Link href="/auth/signin" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  )
}
