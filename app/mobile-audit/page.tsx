import Link from "next/link"
import { Bell, CalendarDays, MapPin, Radio, ShieldCheck, Smartphone, WifiOff } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const target = process.env.NEXT_PUBLIC_MOBILE_TARGET || "PWA"
const platformName = target.toLowerCase() === "ios" ? "iOS" : target.toLowerCase() === "android" ? "Android" : "PWA"

const checks = [
  { label: "Installable shell", status: "Coded locally", icon: Smartphone },
  { label: "Offline fallback/service worker", status: "Coded locally", icon: WifiOff },
  { label: "Push notification APIs", status: "Coded locally", icon: Bell },
  { label: "Timezone and date browsing", status: "Coded locally", icon: CalendarDays },
  { label: "Nearby events and venues", status: "Coded locally", icon: MapPin },
  { label: "Live fixtures/results/news surfaces", status: "Coded locally", icon: Radio },
  { label: "Auth/account/privacy flows", status: "Coded locally", icon: ShieldCheck },
]

export default function MobileAuditPage() {
  return (
    <main className="min-h-dvh bg-background px-4 py-5 pb-24">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <Badge variant="secondary" className="mb-2">
            {platformName} audit host
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight">SportsFixtures mobile app baseline</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Local review build using the current PWA as the starting point.
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {checks.map((check) => {
          const Icon = check.icon
          return (
            <Card key={check.label} className="rounded-lg">
              <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                <Icon className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">{check.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge>{check.status}</Badge>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button asChild variant="outline">
          <Link href="/">Open app</Link>
        </Button>
        <Button asChild>
          <Link href="/auth/signin">Test auth</Link>
        </Button>
      </div>
    </main>
  )
}
