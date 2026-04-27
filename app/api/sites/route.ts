import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import type { Site, HealthCheck } from "@/lib/types"

export async function GET() {
  try {
    const sites = await sql`
      SELECT s.*, 
        (
          SELECT json_build_object(
            'id', h.id,
            'status_code', h.status_code,
            'response_time_ms', h.response_time_ms,
            'is_up', h.is_up,
            'ssl_valid', h.ssl_valid,
            'checked_at', h.checked_at,
            'error_message', h.error_message
          )
          FROM health_checks h 
          WHERE h.site_id = s.id 
          ORDER BY h.checked_at DESC 
          LIMIT 1
        ) as last_check,
        (
          SELECT ROUND(
            (COUNT(*) FILTER (WHERE is_up = true)::decimal / NULLIF(COUNT(*), 0)) * 100, 2
          )
          FROM health_checks 
          WHERE site_id = s.id 
          AND checked_at > NOW() - INTERVAL '24 hours'
        ) as uptime_24h,
        (
          SELECT ROUND(AVG(response_time_ms))
          FROM health_checks 
          WHERE site_id = s.id 
          AND checked_at > NOW() - INTERVAL '24 hours'
          AND is_up = true
        ) as avg_response_time_24h
      FROM sites s
      ORDER BY s.created_at DESC
    `
    
    return NextResponse.json(sites.map((s: any) => ({
      ...s,
      uptime_24h: s.uptime_24h !== null ? Number(s.uptime_24h) : null,
      avg_response_time_24h: s.avg_response_time_24h !== null ? Number(s.avg_response_time_24h) : null,
    })))
  } catch (error) {
    console.error("Error fetching sites:", error)
    return NextResponse.json({ error: "Failed to fetch sites" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, url, check_interval = 5 } = body
    
    if (!name || !url) {
      return NextResponse.json(
        { error: "Name and URL are required" },
        { status: 400 }
      )
    }
    
    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      )
    }
    
    const result = await sql`
      INSERT INTO sites (name, url, check_interval)
      VALUES (${name}, ${url}, ${check_interval})
      RETURNING *
    `
    
    return NextResponse.json(result[0], { status: 201 })
  } catch (error: unknown) {
    console.error("Error creating site:", error)
    if (error && typeof error === 'object' && 'code' in error && error.code === "23505") {
      return NextResponse.json(
        { error: "Site with this URL already exists" },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: "Failed to create site" }, { status: 500 })
  }
}
