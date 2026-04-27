"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/monitoring/stat-card"
import { SitesTable } from "@/components/monitoring/sites-table"
import type { SiteWithStats } from "@/lib/types"
import { 
  Activity, 
  Globe, 
  Clock, 
  AlertTriangle, 
  Plus,
  RefreshCw,
  FileText
} from "lucide-react"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.')
    // Attach extra info to the error object.
    const info = await res.json()
    ;(error as any).status = res.status
    ;(error as any).info = info
    throw error
  }
  return res.json()
}

export default function DashboardPage() {
  const { data: sites, error, isLoading, mutate } = useSWR<SiteWithStats[]>(
    "/api/sites",
    fetcher,
    { refreshInterval: 60000 } // Refresh every minute
  )
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await mutate()
    setIsRefreshing(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Esta seguro que desea eliminar este sitio?")) return
    
    try {
      const res = await fetch(`/api/sites/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error('Failed to delete site')
      mutate()
    } catch (error) {
      console.error("Error deleting site:", error)
      alert("No se pudo eliminar el sitio")
    }
  }

  // Calculate stats
  const sitesArray = Array.isArray(sites) ? sites : []
  const totalSites = sitesArray.length
  const sitesUp = sitesArray.filter((s) => s.last_check?.is_up).length
  const sitesDown = totalSites - sitesUp
  
  // Use null or undefined for loading states to avoid false negatives in UI
  const avgUptimeValue = (isLoading || !sites) ? null : (totalSites > 0
    ? (sitesArray.reduce((sum, s) => sum + Number(s.uptime_24h || 0), 0) / totalSites).toFixed(2)
    : "0")
    
  const avgResponseTimeValue = (isLoading || !sites) ? null : (totalSites > 0
    ? Math.round(sitesArray.reduce((sum, s) => sum + Number(s.avg_response_time_24h || 0), 0) / totalSites)
    : 0)

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="size-12 mx-auto text-destructive mb-4" />
            <h2 className="text-lg font-semibold mb-2">Error al cargar datos</h2>
            <p className="text-muted-foreground mb-4">
              No se pudieron cargar los sitios. Verifica tu conexion.
            </p>
            <Button onClick={() => mutate()}>Reintentar</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="size-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Web Monitor</h1>
              <p className="text-sm text-muted-foreground">Panel de monitoreo</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`size-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
            <Link href="/reports">
              <Button variant="outline" size="sm">
                <FileText className="size-4 mr-2" />
                Informes
              </Button>
            </Link>
            <Link href="/sites/new">
              <Button size="sm">
                <Plus className="size-4 mr-2" />
                Agregar sitio
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Sitios Monitoreados"
            value={totalSites}
            icon={Globe}
            description="Total de sitios activos"
          />
          <StatCard
            title="Sitios Online"
            value={sitesUp}
            icon={Activity}
            trend={sitesDown === 0 ? "up" : "neutral"}
            trendValue={sitesDown === 0 ? "100%" : `${sitesDown} caidos`}
          />
          <StatCard
            title="Uptime Promedio"
            value={avgUptimeValue !== null ? `${avgUptimeValue}%` : "---"}
            icon={Clock}
            description="Ultimas 24 horas"
            trend={avgUptimeValue === null ? "neutral" : (Number(avgUptimeValue) >= 99 ? "up" : Number(avgUptimeValue) >= 95 ? "neutral" : "down")}
          />
          <StatCard
            title="Tiempo Respuesta"
            value={avgResponseTimeValue !== null ? `${avgResponseTimeValue}ms` : "---"}
            icon={Clock}
            description="Promedio 24h"
          />
        </div>

        {/* Sites Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Sitios</CardTitle>
            {isLoading && (
              <span className="text-sm text-muted-foreground">Cargando...</span>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <SitesTable sites={sites || []} onDelete={handleDelete} />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
