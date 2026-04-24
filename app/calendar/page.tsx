"use client";

// app/calendar/page.tsx
// Section 07.C — Canonical /calendar route.
//
// resolveCalendarHref() in lib/navigation-targets.ts points here.
// All calendar CTAs (home module, WatchHereTonight, nav links) must resolve
// to this route — never to /settings/personalization#calendar.
//
// This page renders PersonalizedCalendar full-width with the standard
// app chrome (HeaderMenu, BottomNav, SectionShell breadcrumb).

import { HeaderMenu } from "@/components/header-menu";
import { BottomNav } from "@/components/bottom-nav";
import { SectionShell } from "@/components/navigation/section-shell";
import { PersonalizedCalendar } from "@/components/personalized-calendar";

export default function CalendarPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <HeaderMenu />

      <main className="flex-1">
        <SectionShell
          title="My Calendar"
          subtitle="Upcoming matches from teams and competitions you follow"
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Calendar" }]}
          action={{ label: "Home layout", href: "/settings/home-layout" }}
        >
          {null}
        </SectionShell>

        {/* Calendar rendered outside the SectionShell padding so it can use full width */}
        <PersonalizedCalendar />
      </main>

      <BottomNav />
    </div>
  );
}
