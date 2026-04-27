"use client"

import { use } from "react"
import useSWR from "swr"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/monitoring/stat-card"
import { StatusBadge } from "@/components/monitoring/status-badge"
import { ResponseTimeChart } from "@/components/monitoring/response-time-chart"
import { UptimeChart } from "@/components/monitoring/uptime-chart"
import type { Site, HealthCheck } from "@/lib/types"
import { 
  ArrowLeft, 
  ExternalLink, 
  Activity, 
  Clock, 
  TriangleAlert,
  CircleCheck,
  CircleX,
  Shield
} from "lucide-react"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.')
    const info = await res.json()
    ;(error as any).status = res.status
    ;(error as any).info = info
    throw error
  }
  return res.json()
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function SiteDetailPage({ params }: PageProps) {
  const { id } = use(params)
  
  const { data: site, error: siteError } = useSWR<Site>(
    `/api/sites/${id}`,
    fetcher
  )
  
  const { data: checks } = useSWR<HealthCheck[]>(
    `/api/sites/${id}/checks?limit=100&hours=24`,
    fetcher,
    { refreshInterval: 60000 }
  )
  
  const { data: stats } = useSWR<{
    daily: Array<{ date: string; uptime: number | null; total_checks: number; successful_checks: number }>
    hourly: Array<{ hour: string; uptime: number | null; avg_response_time: number | null }>
    overall: {
      uptime: number | null
      avg_response_time: number | null
      min_response_time: number | null
      max_response_time: number | null
      error_4xx_count: number
      error_5xx_count: number
      ssl_issues_count: number
    }
  }>(
    `/api/sites/${id}/stats?days=7`,
    fetcher
  )

  if (siteError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <TriangleAlert className="size-12 mx-auto text-destructive mb-4" />
            <h2 className="text-lg font-semibold mb-2">Sitio no encontrado</h2>
            <Link href="/">
              <Button>Volver al dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!site) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  const lastCheck = checks?.[0]
  const overall = stats?.overall

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="size-4" />
            Volver al dashboard
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{site.name}</h1>
                <StatusBadge isUp={lastCheck?.is_up ?? false} />
              </div>
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mt-1"
              >
                {site.url}
                <ExternalLink className="size-3" />
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Uptime (7 dias)"
            value={overall?.uptime ? `${overall.uptime}%` : "-"}
            icon={Activity}
            trend={overall?.uptime && overall.uptime >= 99 ? "up" : "neutral"}
          />
          <StatCard
            title="Tiempo Respuesta"
            value={overall?.avg_response_time ? `${overall.avg_response_time}ms` : "-"}
            icon={Clock}
            description={overall?.min_response_time && overall?.max_response_time 
              ? `Min: ${overall.min_response_time}ms / Max: ${overall.max_response_time}ms`
              : undefined
            }
          />
          <StatCard
            title="Errores HTTP"
            value={(overall?.error_4xx_count || 0) + (overall?.error_5xx_count || 0)}
            icon={CircleX}
            description={`4xx: ${overall?.error_4xx_count || 0} / 5xx: ${overall?.error_5xx_count || 0}`}
          />
          <StatCard
            title="SSL"
            value={lastCheck?.ssl_valid ? "Valido" : "Sin datos"}
            icon={Shield}
            trend={lastCheck?.ssl_valid ? "up" : "neutral"}
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <ResponseTimeChart 
            checks={checks || []} 
            title="Tiempo de Respuesta (24h)"
          />
          <UptimeChart 
            dailyStats={stats?.daily || []} 
            title="Uptime Diario (7 dias)"
          />
        </div>

        {/* Recent Checks */}
        <Card>
          <CardHeader>
            <CardTitle>Ultimos Chequeos</CardTitle>
          </CardHeader>
          <CardContent>
            {!checks || checks.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No hay chequeos registrados aun
              </p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {checks.slice(0, 20).map((check) => (
                  <div
                    key={check.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      {check.is_up ? (
                        <CircleCheck className="size-4 text-success" />
                      ) : (
                        <CircleX className="size-4 text-destructive" />
                      )}
                      <span className="text-sm">
                        {new Date(check.checked_at).toLocaleString("es")}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {check.status_code && (
                        <span className={check.status_code >= 400 ? "text-destructive" : "text-muted-foreground"}>
                          HTTP {check.status_code}
                        </span>
                      )}
                      {check.response_time_ms && (
                        <span className="text-muted-foreground">
                          {check.response_time_ms}ms
                        </span>
                      )}
                      {check.error_message && (
                        <span className="text-destructive text-xs max-w-[200px] truncate">
                          {check.error_message}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
