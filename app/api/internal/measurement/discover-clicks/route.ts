import { NextResponse } from "next/server"

export async function GET() {
  // Replace this with Search Console export / ingestion query
  return NextResponse.json({
    clicks: 0,
  })
}
