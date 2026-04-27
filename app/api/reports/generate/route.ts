import { NextRequest, NextResponse } from "next/server"
import { generateMonthlyReport, generateAllMonthlyReports } from "@/lib/reports"

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { siteId, month } = body
    
    // Parse month or use previous month
    let targetMonth: Date
    if (month) {
      targetMonth = new Date(month)
    } else {
      targetMonth = new Date()
      targetMonth.setMonth(targetMonth.getMonth() - 1)
    }
    
    let reports
    
    if (siteId) {
      const report = await generateMonthlyReport(parseInt(siteId), targetMonth)
      reports = report ? [report] : []
    } else {
      reports = await generateAllMonthlyReports(targetMonth)
    }
    
    return NextResponse.json({
      success: true,
      message: `Generated ${reports.length} report(s)`,
      reports,
    })
  } catch (error) {
    console.error("Error generating reports:", error)
    return NextResponse.json({ error: "Failed to generate reports" }, { status: 500 })
  }
}
