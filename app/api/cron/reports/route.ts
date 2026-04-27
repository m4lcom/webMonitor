import { NextRequest, NextResponse } from "next/server"
import { generateAllMonthlyReports } from "@/lib/reports"
import { sql } from "@/lib/db"
import { Resend } from "resend"

export const maxDuration = 60

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    // Generate reports for the previous month
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    
    const reports = await generateAllMonthlyReports(lastMonth)
    
    // Send email if configured
    if (resend && process.env.REPORT_EMAIL) {
      const monthName = lastMonth.toLocaleDateString("es", { month: "long", year: "numeric" })
      
      // Create email summary
      const summary = reports.map(r => {
        const data = r.report_data as { site_name: string; site_url: string } | null
        return `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${data?.site_name || "Unknown"}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${r.uptime_percentage?.toFixed(2)}%</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${r.avg_response_time_ms || "-"}ms</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${r.total_checks}</td>
          </tr>
        `
      }).join("")
      
      await resend.emails.send({
        from: "Web Monitor <onboarding@resend.dev>",
        to: process.env.REPORT_EMAIL,
        subject: `Informe de Monitoreo - ${monthName}`,
        html: `
          <h1>Informe Mensual de Monitoreo</h1>
          <p>Periodo: ${monthName}</p>
          
          <table style="border-collapse: collapse; width: 100%; margin-top: 20px;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Sitio</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Uptime</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Resp. Promedio</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Total Checks</th>
              </tr>
            </thead>
            <tbody>
              ${summary}
            </tbody>
          </table>
          
          <p style="margin-top: 20px; color: #666;">
            Para ver el informe completo, accede al dashboard.
          </p>
        `,
      })
      
      // Mark reports as sent
      for (const report of reports) {
        await sql`
          UPDATE monthly_reports 
          SET email_sent_at = NOW() 
          WHERE id = ${report.id}
        `
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Generated ${reports.length} reports`,
      emailSent: !!(resend && process.env.REPORT_EMAIL),
    })
  } catch (error) {
    console.error("Error in cron reports:", error)
    return NextResponse.json({ error: "Failed to generate reports" }, { status: 500 })
  }
}
