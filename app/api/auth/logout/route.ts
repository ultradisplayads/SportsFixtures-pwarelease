import { NextRequest, NextResponse } from "next/server"

const COOKIE_NAME = "sf_auth"

/**
 * POST /api/auth/logout
 * Clears the httpOnly auth cookie.
 * Matches main web app exactly.
 */
export async function POST(req: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully.",
  })

  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  })

  return response
}