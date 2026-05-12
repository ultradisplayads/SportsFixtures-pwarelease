"use client"

import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

const ADMIN_ROLE_TYPES = new Set(["admin", "internal", "super-admin", "super_admin"])

function normalise(value: unknown) {
  return String(value || "").trim().toLowerCase()
}

function isAdminRole(role?: { type?: string; name?: string }) {
  const roleType = normalise(role?.type)
  const roleName = normalise(role?.name)
  return ADMIN_ROLE_TYPES.has(roleType) || ADMIN_ROLE_TYPES.has(roleName)
}

export function AdminRouteGate({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 text-sm text-muted-foreground">
        Checking admin session...
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-5">
          <ShieldAlert className="mb-3 h-6 w-6 text-amber-500" />
          <h1 className="text-lg font-bold">Admin login required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This operator area is restricted to Marc and approved admin users.
          </p>
          <Link
            href="/auth/signin"
            className="mt-4 inline-flex rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
          >
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  if (!isAdminRole(user?.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-5">
          <ShieldAlert className="mb-3 h-6 w-6 text-destructive" />
          <h1 className="text-lg font-bold">Admin permission required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account is signed in, but it is not assigned an admin/operator role.
          </p>
          <Link href="/" className="mt-4 inline-flex text-sm font-semibold text-primary">
            Return home
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
