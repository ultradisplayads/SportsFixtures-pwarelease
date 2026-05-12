"use client"

import { AdminRouteGate } from "@/components/admin/admin-route-gate"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminRouteGate>{children}</AdminRouteGate>
}
