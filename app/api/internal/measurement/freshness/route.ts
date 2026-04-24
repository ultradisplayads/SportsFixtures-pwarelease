import { NextResponse } from "next/server"

export async function GET() {
  // Replace with real freshness rows from Strapi/backend
  // Example shape:
  // [{ path: "/team/133604", pageType: "team", title: "Celtic", updatedAt: "2026-04-25T12:00:00.000Z" }]
  return NextResponse.json([])
}
