import { NextResponse } from "next/server"
import { getDirectorySports } from "@/lib/sf-directory"

export async function GET() {
  try {
    const sports = await getDirectorySports()
    return NextResponse.json({ sports })
  } catch (error) {
    console.error("[api/sports]", error)
    return NextResponse.json({ sports: [], error: "Failed to load sports" }, { status: 502 })
  }
}
