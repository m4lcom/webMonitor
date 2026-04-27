import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get("siteId")
    const limit = Math.min(parseInt(searchParams.get("limit") || "12"), 24)
    
    let reports
    
    if (siteId) {
      reports = await sql`
        SELECT r.*, s.name as site_name, s.url as site_url
        FROM monthly_reports r
        LEFT JOIN sites s ON r.site_id = s.id
        WHERE r.site_id = ${parseInt(siteId)}
        ORDER BY r.report_month DESC
        LIMIT ${limit}
      `
    } else {
      reports = await sql`
        SELECT r.*, s.name as site_name, s.url as site_url
        FROM monthly_reports r
        LEFT JOIN sites s ON r.site_id = s.id
        ORDER BY r.report_month DESC, r.created_at DESC
        LIMIT ${limit}
      `
    }
    
    return NextResponse.json(reports)
  } catch (error) {
    console.error("Error fetching reports:", error)
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
  }
}
