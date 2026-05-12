import { NextRequest, NextResponse } from "next/server"

const COOKIE_NAME = "sf_auth"

export type AdminSession =
  | { ok: true; jwt: string; user: any }
  | { ok: false; response: NextResponse }

const STRAPI = () =>
  (process.env.SF_API_URL || "https://staging-api.sportsfixtures.net")
    .replace(/\/api-docs\/?$/, "")
    .replace(/\/$/, "")

const ADMIN_ROLE_KEYS = new Set([
  "admin",
  "administrator",
  "super-admin",
  "super_admin",
])

function normalise(value: unknown) {
  return String(value || "").trim().toLowerCase()
}

function configuredAdminIds() {
  return (process.env.SF_ADMIN_USERS || "")
    .split(",")
    .map((value) => normalise(value))
    .filter(Boolean)
}

function isAdminUser(user: any) {
  const role = user?.role || {}
  const roleName = normalise(role.name || role.type || role.code)
  const userIds = [
    user?.username,
    user?.email,
    user?.id,
    user?.documentId,
  ].map((value) => normalise(value))

  return (
    ADMIN_ROLE_KEYS.has(roleName) ||
    configuredAdminIds().some((id) => userIds.includes(id))
  )
}

export async function requireAdminSession(req: NextRequest): Promise<AdminSession> {
  const jwt = req.cookies.get(COOKIE_NAME)?.value

  if (!jwt) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Admin login required" }, { status: 401 }),
    }
  }

  try {
    const res = await fetch(`${STRAPI()}/api/auth/me`, {
      headers: { Authorization: `Bearer ${jwt}` },
      cache: "no-store",
    })

    if (!res.ok) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Admin session invalid" }, { status: 401 }),
      }
    }

    const data = await res.json()
    const user = data?.user || data

    if (!isAdminUser(user)) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Admin permission required" }, { status: 403 }),
      }
    }

    return { ok: true, jwt, user }
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unable to verify admin session" }, { status: 503 }),
    }
  }
}
