import { sql } from "./db"
import type { Site, MonthlyReport, ReportData, DailyStat, Incident } from "./types"

export async function generateMonthlyReport(siteId: number, month: Date): Promise<MonthlyReport | null> {
  // Get the first and last day of the month
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1)
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59)
  
  // Get site info
  const sites = await sql`SELECT * FROM sites WHERE id = ${siteId}`
  if (sites.length === 0) return null
  const site = sites[0] as Site
  
  // Get all checks for the month
  const checks = await sql`
    SELECT * FROM health_checks 
    WHERE site_id = ${siteId}
    AND checked_at >= ${startOfMonth.toISOString()}
    AND checked_at <= ${endOfMonth.toISOString()}
    ORDER BY checked_at ASC
  `
  
  if (checks.length === 0) return null
  
  // Calculate statistics
  const totalChecks = checks.length
  const successfulChecks = checks.filter((c: { is_up: boolean }) => c.is_up).length
  const uptimePercentage = (successfulChecks / totalChecks) * 100
  
  const responseTimes = checks
    .filter((c: { response_time_ms: number | null }) => c.response_time_ms !== null)
    .map((c: { response_time_ms: number }) => c.response_time_ms)
  
  const avgResponseTime = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length)
    : null
  const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : null
  const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : null
  
  const sslIssues = checks.filter((c: { ssl_valid: boolean }) => c.ssl_valid === false).length
  const error4xx = checks.filter((c: { status_code: number | null }) => c.status_code !== null && c.status_code >= 400 && c.status_code < 500).length
  const error5xx = checks.filter((c: { status_code: number | null }) => c.status_code !== null && c.status_code >= 500).length
  
  // Calculate daily stats
  const dailyStats: DailyStat[] = []
  const checksByDate = new Map<string, Array<{ is_up: boolean; response_time_ms: number | null }>>()
  
  for (const check of checks) {
    const date = new Date(check.checked_at).toISOString().split('T')[0]
    if (!checksByDate.has(date)) {
      checksByDate.set(date, [])
    }
    checksByDate.get(date)!.push(check)
  }
  
  for (const [date, dayChecks] of checksByDate) {
    const daySuccessful = dayChecks.filter(c => c.is_up).length
    const dayResponseTimes = dayChecks
      .filter(c => c.response_time_ms !== null)
      .map(c => c.response_time_ms!)
    
    dailyStats.push({
      date,
      uptime: (daySuccessful / dayChecks.length) * 100,
      avg_response_time: dayResponseTimes.length > 0
        ? Math.round(dayResponseTimes.reduce((a, b) => a + b, 0) / dayResponseTimes.length)
        : 0,
      checks_count: dayChecks.length,
    })
  }
  
  // Detect incidents (consecutive failures)
  const incidents: Incident[] = []
  let currentIncident: Incident | null = null
  
  for (const check of checks) {
    if (!check.is_up) {
      if (!currentIncident) {
        currentIncident = {
          started_at: check.checked_at,
          ended_at: null,
          duration_minutes: 0,
          error_message: check.error_message,
        }
      }
    } else if (currentIncident) {
      currentIncident.ended_at = check.checked_at
      currentIncident.duration_minutes = Math.round(
        (new Date(check.checked_at).getTime() - new Date(currentIncident.started_at).getTime()) / 60000
      )
      incidents.push(currentIncident)
      currentIncident = null
    }
  }
  
  // If there's an ongoing incident
  if (currentIncident) {
    currentIncident.ended_at = endOfMonth.toISOString()
    currentIncident.duration_minutes = Math.round(
      (endOfMonth.getTime() - new Date(currentIncident.started_at).getTime()) / 60000
    )
    incidents.push(currentIncident)
  }
  
  const reportData: ReportData = {
    site_name: site.name,
    site_url: site.url,
    daily_stats: dailyStats,
    incidents,
  }
  
  // Save or update the report
  const reportMonth = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-01`
  
  const existingReport = await sql`
    SELECT id FROM monthly_reports 
    WHERE site_id = ${siteId} AND report_month = ${reportMonth}
  `
  
  let report: MonthlyReport
  
  if (existingReport.length > 0) {
    const updated = await sql`
      UPDATE monthly_reports SET
        total_checks = ${totalChecks},
        successful_checks = ${successfulChecks},
        uptime_percentage = ${uptimePercentage},
        avg_response_time_ms = ${avgResponseTime},
        min_response_time_ms = ${minResponseTime},
        max_response_time_ms = ${maxResponseTime},
        ssl_issues_count = ${sslIssues},
        error_4xx_count = ${error4xx},
        error_5xx_count = ${error5xx},
        report_data = ${JSON.stringify(reportData)}
      WHERE id = ${existingReport[0].id}
      RETURNING *
    `
    report = updated[0] as MonthlyReport
  } else {
    const inserted = await sql`
      INSERT INTO monthly_reports (
        site_id, report_month, total_checks, successful_checks,
        uptime_percentage, avg_response_time_ms, min_response_time_ms,
        max_response_time_ms, ssl_issues_count, error_4xx_count,
        error_5xx_count, report_data
      ) VALUES (
        ${siteId}, ${reportMonth}, ${totalChecks}, ${successfulChecks},
        ${uptimePercentage}, ${avgResponseTime}, ${minResponseTime},
        ${maxResponseTime}, ${sslIssues}, ${error4xx},
        ${error5xx}, ${JSON.stringify(reportData)}
      )
      RETURNING *
    `
    report = inserted[0] as MonthlyReport
  }
  
  return report
}

export async function generateAllMonthlyReports(month: Date): Promise<MonthlyReport[]> {
  const sites = await sql`SELECT id FROM sites WHERE is_active = true`
  const reports: MonthlyReport[] = []
  
  for (const site of sites) {
    const report = await generateMonthlyReport(site.id, month)
    if (report) reports.push(report)
  }
  
  return reports
}
