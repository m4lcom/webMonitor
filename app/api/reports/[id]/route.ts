import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const reportId = parseInt(id)
    
    if (isNaN(reportId)) {
      return NextResponse.json({ error: "Invalid report ID" }, { status: 400 })
    }
    
    const reports = await sql`
      SELECT r.*, s.name as site_name, s.url as site_url
      FROM monthly_reports r
      LEFT JOIN sites s ON r.site_id = s.id
      WHERE r.id = ${reportId}
    `
    
    if (reports.length === 0) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }
    
    return NextResponse.json(reports[0])
  } catch (error) {
    console.error("Error fetching report:", error)
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 })
  }
}
