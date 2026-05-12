import { NextResponse } from "next/server"
import { getDirectoryCountries } from "@/lib/sf-directory"

export async function GET() {
  try {
    const countries = await getDirectoryCountries()
    return NextResponse.json({ countries })
  } catch (error) {
    console.error("[api/countries]", error)
    return NextResponse.json({ countries: [], error: "Failed to load countries" }, { status: 502 })
  }
}
