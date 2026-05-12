import Link from "next/link"
import { Building2, Mail, MessageSquare, ShieldCheck } from "lucide-react"

import { BottomNav } from "@/components/bottom-nav"
import { HeaderMenu } from "@/components/header-menu"

const contactItems = [
  {
    icon: Mail,
    title: "General support",
    copy: "For app support, data issues, fixture questions, and account help.",
    href: "mailto:support@sportsfixtures.net",
    cta: "Email support",
  },
  {
    icon: Building2,
    title: "Venues and partners",
    copy: "For sports bars, venue owners, sponsorships, offers, and screen-network enquiries.",
    href: "/venues/owner-signup",
    cta: "Venue owner sign up",
  },
  {
    icon: ShieldCheck,
    title: "Privacy and data",
    copy: "For account deletion, consent, cookies, and personal data requests.",
    href: "/privacy",
    cta: "Privacy details",
  },
]

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <HeaderMenu />
      <main className="flex-1 p-4">
        <div className="mb-5 rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 inline-flex rounded-xl bg-primary/10 p-2 text-primary">
            <MessageSquare className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold">Contact</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Get help with the app, venues, commercial partnerships, privacy, and SportsFixtures account questions.
          </p>
        </div>

        <div className="space-y-3">
          {contactItems.map((item) => {
            const Icon = item.icon
            const external = item.href.startsWith("mailto:")
            return (
              <Link
                key={item.title}
                href={item.href}
                className="block rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent"
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold">{item.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.copy}</p>
                    <p className="mt-2 text-sm font-bold text-primary">{item.cta}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
