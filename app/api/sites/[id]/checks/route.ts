import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const siteId = parseInt(id)
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 1000)
    const hours = parseInt(searchParams.get("hours") || "24")
    
    if (isNaN(siteId)) {
      return NextResponse.json({ error: "Invalid site ID" }, { status: 400 })
    }
    
    const checks = await sql`
      SELECT * FROM health_checks 
      WHERE site_id = ${siteId}
      AND checked_at > NOW() - INTERVAL '1 hour' * ${hours}
      ORDER BY checked_at DESC
      LIMIT ${limit}
    `
    
    return NextResponse.json(checks)
  } catch (error) {
    console.error("Error fetching checks:", error)
    return NextResponse.json({ error: "Failed to fetch checks" }, { status: 500 })
  }
}
