-- Web Monitoring Agent - Database Schema
-- Creates tables for sites, health checks, and monthly reports

-- Sites table: stores the URLs to monitor
CREATE TABLE IF NOT EXISTS sites (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(2048) NOT NULL UNIQUE,
  check_interval INTEGER DEFAULT 5, -- minutes
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health checks table: stores each monitoring check result
CREATE TABLE IF NOT EXISTS health_checks (
  id SERIAL PRIMARY KEY,
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  status_code INTEGER,
  response_time_ms INTEGER, -- response time in milliseconds
  is_up BOOLEAN NOT NULL,
  ssl_valid BOOLEAN,
  ssl_expires_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Monthly reports table: stores generated reports
CREATE TABLE IF NOT EXISTS monthly_reports (
  id SERIAL PRIMARY KEY,
  site_id INTEGER REFERENCES sites(id) ON DELETE SET NULL,
  report_month DATE NOT NULL, -- first day of the month
  total_checks INTEGER DEFAULT 0,
  successful_checks INTEGER DEFAULT 0,
  uptime_percentage DECIMAL(5,2),
  avg_response_time_ms INTEGER,
  min_response_time_ms INTEGER,
  max_response_time_ms INTEGER,
  ssl_issues_count INTEGER DEFAULT 0,
  error_4xx_count INTEGER DEFAULT 0,
  error_5xx_count INTEGER DEFAULT 0,
  report_data JSONB, -- full report data for PDF generation
  email_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_health_checks_site_id ON health_checks(site_id);
CREATE INDEX IF NOT EXISTS idx_health_checks_checked_at ON health_checks(checked_at);
CREATE INDEX IF NOT EXISTS idx_health_checks_site_checked ON health_checks(site_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_site_month ON monthly_reports(site_id, report_month);

-- Add a comment describing the schema
COMMENT ON TABLE sites IS 'Websites to monitor for uptime and performance';
COMMENT ON TABLE health_checks IS 'Individual health check results for each monitored site';
COMMENT ON TABLE monthly_reports IS 'Aggregated monthly reports with statistics and metrics';
