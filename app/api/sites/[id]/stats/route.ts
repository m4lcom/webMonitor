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
    const days = Math.min(parseInt(searchParams.get("days") || "7"), 90)
    
    if (isNaN(siteId)) {
      return NextResponse.json({ error: "Invalid site ID" }, { status: 400 })
    }
    
    // Get daily stats
    const dailyStats = await sql`
      SELECT 
        DATE(checked_at) as date,
        COUNT(*) as total_checks,
        COUNT(*) FILTER (WHERE is_up = true) as successful_checks,
        ROUND((COUNT(*) FILTER (WHERE is_up = true)::decimal / NULLIF(COUNT(*), 0)) * 100, 2) as uptime,
        ROUND(AVG(response_time_ms) FILTER (WHERE is_up = true)) as avg_response_time,
        MIN(response_time_ms) FILTER (WHERE is_up = true) as min_response_time,
        MAX(response_time_ms) FILTER (WHERE is_up = true) as max_response_time,
        COUNT(*) FILTER (WHERE status_code >= 400 AND status_code < 500) as error_4xx,
        COUNT(*) FILTER (WHERE status_code >= 500) as error_5xx
      FROM health_checks 
      WHERE site_id = ${siteId}
      AND checked_at > NOW() - INTERVAL '1 day' * ${days}
      GROUP BY DATE(checked_at)
      ORDER BY date DESC
    `
    
    // Get hourly stats for last 24 hours
    const hourlyStats = await sql`
      SELECT 
        DATE_TRUNC('hour', checked_at) as hour,
        COUNT(*) as total_checks,
        COUNT(*) FILTER (WHERE is_up = true) as successful_checks,
        ROUND((COUNT(*) FILTER (WHERE is_up = true)::decimal / NULLIF(COUNT(*), 0)) * 100, 2) as uptime,
        ROUND(AVG(response_time_ms) FILTER (WHERE is_up = true)) as avg_response_time
      FROM health_checks 
      WHERE site_id = ${siteId}
      AND checked_at > NOW() - INTERVAL '24 hours'
      GROUP BY DATE_TRUNC('hour', checked_at)
      ORDER BY hour DESC
    `
    
    // Get overall stats
    const overallStats = await sql`
      SELECT 
        COUNT(*) as total_checks,
        COUNT(*) FILTER (WHERE is_up = true) as successful_checks,
        ROUND((COUNT(*) FILTER (WHERE is_up = true)::decimal / NULLIF(COUNT(*), 0)) * 100, 2) as uptime,
        ROUND(AVG(response_time_ms) FILTER (WHERE is_up = true)) as avg_response_time,
        MIN(response_time_ms) FILTER (WHERE is_up = true) as min_response_time,
        MAX(response_time_ms) FILTER (WHERE is_up = true) as max_response_time,
        COUNT(*) FILTER (WHERE status_code >= 400 AND status_code < 500) as error_4xx_count,
        COUNT(*) FILTER (WHERE status_code >= 500) as error_5xx_count,
        COUNT(*) FILTER (WHERE ssl_valid = false) as ssl_issues_count
      FROM health_checks 
      WHERE site_id = ${siteId}
      AND checked_at > NOW() - INTERVAL '1 day' * ${days}
    `
    
    return NextResponse.json({
      daily: dailyStats,
      hourly: hourlyStats,
      overall: overallStats[0] || {},
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
