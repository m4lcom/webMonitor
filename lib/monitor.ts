import { sql } from "./db"
import type { CheckResult, Site, HealthCheck } from "./types"

export async function checkSite(url: string): Promise<CheckResult> {
  const startTime = Date.now()
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout
    
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "WebMonitor/1.0",
      },
    })
    
    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime
    
    // Check SSL certificate
    let sslValid: boolean | null = null
    let sslExpiresAt: Date | null = null
    
    if (url.startsWith("https://")) {
      // For HTTPS, if we got a response, SSL is valid
      // We can't get expiry date from client-side, but connection success means valid
      sslValid = true
      // Set a placeholder expiry - in production you'd use a proper SSL checker
      sslExpiresAt = null
    }
    
    return {
      is_up: response.ok,
      status_code: response.status,
      response_time_ms: responseTime,
      ssl_valid: sslValid,
      ssl_expires_at: sslExpiresAt,
      error_message: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`,
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    
    return {
      is_up: false,
      status_code: null,
      response_time_ms: responseTime,
      ssl_valid: errorMessage.includes("SSL") || errorMessage.includes("certificate") ? false : null,
      ssl_expires_at: null,
      error_message: errorMessage,
    }
  }
}

export async function runHealthChecks(): Promise<{ checked: number; errors: number }> {
  const sites = await sql`
    SELECT * FROM sites WHERE is_active = true
  ` as Site[]
  
  let checked = 0
  let errors = 0
  
  for (const site of sites) {
    try {
      const result = await checkSite(site.url)
      
      await sql`
        INSERT INTO health_checks (
          site_id, status_code, response_time_ms, is_up, 
          ssl_valid, ssl_expires_at, error_message
        ) VALUES (
          ${site.id}, ${result.status_code}, ${result.response_time_ms}, 
          ${result.is_up}, ${result.ssl_valid}, ${result.ssl_expires_at}, 
          ${result.error_message}
        )
      `
      
      checked++
      if (!result.is_up) errors++
    } catch (error) {
      console.error(`Error checking site ${site.url}:`, error)
      errors++
    }
  }
  
  return { checked, errors }
}

export async function getSiteStats(siteId: number, hours: number = 24) {
  const checks = await sql`
    SELECT * FROM health_checks 
    WHERE site_id = ${siteId} 
    AND checked_at > NOW() - INTERVAL '${hours} hours'
    ORDER BY checked_at DESC
  ` as HealthCheck[]
  
  if (checks.length === 0) {
    return {
      uptime: 0,
      avg_response_time: 0,
      total_checks: 0,
      successful_checks: 0,
    }
  }
  
  const successfulChecks = checks.filter(c => c.is_up).length
  const avgResponseTime = checks.reduce((sum, c) => sum + (c.response_time_ms || 0), 0) / checks.length
  
  return {
    uptime: (successfulChecks / checks.length) * 100,
    avg_response_time: Math.round(avgResponseTime),
    total_checks: checks.length,
    successful_checks: successfulChecks,
  }
}

export async function getRecentChecks(siteId: number, limit: number = 100) {
  return await sql`
    SELECT * FROM health_checks 
    WHERE site_id = ${siteId}
    ORDER BY checked_at DESC
    LIMIT ${limit}
  ` as HealthCheck[]
}
