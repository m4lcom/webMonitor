export interface Site {
  id: number
  name: string
  url: string
  check_interval: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface HealthCheck {
  id: number
  site_id: number
  status_code: number | null
  response_time_ms: number | null
  is_up: boolean
  ssl_valid: boolean | null
  ssl_expires_at: string | null
  error_message: string | null
  checked_at: string
}

export interface MonthlyReport {
  id: number
  site_id: number | null
  report_month: string
  total_checks: number
  successful_checks: number
  uptime_percentage: number
  avg_response_time_ms: number | null
  min_response_time_ms: number | null
  max_response_time_ms: number | null
  ssl_issues_count: number
  error_4xx_count: number
  error_5xx_count: number
  report_data: ReportData | null
  email_sent_at: string | null
  created_at: string
}

export interface ReportData {
  site_name: string
  site_url: string
  daily_stats: DailyStat[]
  incidents: Incident[]
}

export interface DailyStat {
  date: string
  uptime: number
  avg_response_time: number
  checks_count: number
}

export interface Incident {
  started_at: string
  ended_at: string | null
  duration_minutes: number
  error_message: string | null
}

export interface SiteWithStats extends Site {
  last_check?: HealthCheck
  uptime_24h?: number
  avg_response_time_24h?: number
}

export interface CheckResult {
  is_up: boolean
  status_code: number | null
  response_time_ms: number
  ssl_valid: boolean | null
  ssl_expires_at: Date | null
  error_message: string | null
}
