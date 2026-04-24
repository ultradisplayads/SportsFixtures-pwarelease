"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft, Bell } from "lucide-react"
import { HeaderMenu } from "@/components/header-menu"
import { BottomNav } from "@/components/bottom-nav"
import { NotificationPreferencesForm } from "@/components/notification-preferences-form"
import { useNotifications } from "@/hooks/use-notifications"
import { Spinner } from "@/components/ui/spinner"

export default function NotificationSettingsPage() {
  const router = useRouter()
  const { loaded } = useNotifications()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <HeaderMenu />

      <div className="flex-1 overflow-auto pb-24">
        {/* Page header */}
        <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-2 hover:bg-accent transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <Bell className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold">Notifications</h1>
        </div>

        <div className="px-4 pt-2">
          {!loaded ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              <Spinner className="h-6 w-6" />
              <p className="text-sm">Loading your preferences…</p>
            </div>
          ) : (
            <NotificationPreferencesForm />
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
