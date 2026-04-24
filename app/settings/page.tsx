"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronRight, Bell, FileText, Shield, User, Crown, Trash2, LayoutDashboard, Sparkles, RotateCcw, Sliders, Settings2 } from "lucide-react"
import { HeaderMenu } from "@/components/header-menu"
import { BottomNav } from "@/components/bottom-nav"
import { PremiumBadge } from "@/components/premium-badge"
import { useAppSettings } from "@/hooks/use-app-settings"

const accountItems = [
  { href: "/premium",                   title: "Subscription",      description: "Bronze / Silver / Gold — Launch Pass active",          icon: Crown },
  { href: "/settings/notifications",    title: "Notifications",     description: "Push alerts, reminder windows, and quiet hours",        icon: Bell },
  { href: "/profile",                   title: "Profile",           description: "Account details, identity, and sign-in status",        icon: User },
  { href: "/profile#privacy",           title: "Privacy & Consent", description: "Manage your data, consent, and personalisation choices", icon: Shield },
]

const appItems = [
  { href: "/settings/personalization",  title: "Personalization", description: "Followed teams, players, venues, timezone, and calendar", icon: Sliders },
  { href: "/settings/home-layout",      title: "Home Layout",     description: "Reorder your home screen modules",                 icon: LayoutDashboard },
  { href: "/onboarding/follow-teams",   title: "Redo Onboarding", description: "Re-run setup to change sports and teams",          icon: RotateCcw },
]

const legalItems = [
  { href: "/privacy", title: "Privacy Policy", description: "How app data, location, and notifications are used", icon: Shield },
  { href: "/terms",   title: "Terms of Service", description: "Read the terms for Sports Fixtures",              icon: FileText },
]

function SettingsRow({ href, title, description, icon: Icon }: { href: string; title: string; description: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent active:scale-[0.98]"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </Link>
  )
}

function SettingsToggleRow({
  icon: Icon,
  title,
  description,
  enabled,
  onToggle,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
      </div>
      <button
        onClick={onToggle}
        aria-pressed={enabled}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          enabled ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
        <span className="sr-only">{enabled ? `${title} on` : `${title} off`}</span>
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const { settings, toggle } = useAppSettings()
  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <HeaderMenu />
      <main className="flex-1 p-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your preferences and account.</p>
          </div>
          <PremiumBadge />
        </div>

        {/* Account */}
        <div className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Account</p>
          <div className="space-y-3">
            {accountItems.map((item) => <SettingsRow key={item.href} {...item} />)}
          </div>
        </div>

        {/* App */}
        <div className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">App</p>
          <div className="space-y-3">
            {appItems.map((item) => <SettingsRow key={item.href} {...item} />)}
          </div>
        </div>

        {/* Animations */}
        <div className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Animations</p>
          <div className="space-y-3">
            <SettingsToggleRow
              icon={Sparkles}
              title="Quirky Animations"
              description="Mascot pop-ins, spinning sport balls, and surprise effects — off by default"
              enabled={settings.quirkyAnimations}
              onToggle={() => toggle("quirkyAnimations")}
            />
            <SettingsToggleRow
              icon={Sparkles}
              title="Fan Mode"
              description="Colour animations for your team colours on match day"
              enabled={settings.fanMode}
              onToggle={() => toggle("fanMode")}
            />
          </div>
        </div>

        {/* Legal */}
        <div className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Legal</p>
          <div className="space-y-3">
            {legalItems.map((item) => <SettingsRow key={item.href} {...item} />)}
          </div>
        </div>

        {/* Operator */}
        <div className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Operator</p>
          <SettingsRow
            href="/admin"
            title="Admin Dashboard"
            description="Control plane, homepage modules, ticker, tournament mode, push notifications"
            icon={Settings2}
          />
        </div>

        {/* Danger zone */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-destructive/70">Danger Zone</p>
          <Link
            href="/settings/delete-account"
            className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/5 p-4 transition-colors hover:bg-destructive/10 active:scale-[0.98]"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-destructive/10 p-2 text-destructive">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-destructive">Delete Account</div>
                <div className="text-sm text-muted-foreground">Permanently remove all your data</div>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
          </Link>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
