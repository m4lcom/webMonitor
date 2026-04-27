"use client"

import { use, useRef } from "react"
import useSWR from "swr"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/monitoring/stat-card"
import { UptimeChart } from "@/components/monitoring/uptime-chart"
import type { MonthlyReport, ReportData } from "@/lib/types"
import { 
  ArrowLeft, 
  Activity, 
  Clock, 
  AlertTriangle,
  XCircle,
  Download,
  Mail
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

interface ReportWithSite extends MonthlyReport {
  site_name: string
  site_url: string
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ReportDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const reportRef = useRef<HTMLDivElement>(null)
  
  const { data: report, error } = useSWR<ReportWithSite>(
    `/api/reports/${id}`,
    fetcher
  )

  const handleExportPDF = async () => {
    if (!reportRef.current) return
    
    // Dynamic import to avoid SSR issues
    const html2canvas = (await import("html2canvas")).default
    const jsPDF = (await import("jspdf")).default
    
    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
    })
    
    const imgData = canvas.toDataURL("image/png")
    const pdf = new jsPDF("p", "mm", "a4")
    const imgWidth = 210
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)
    
    const monthName = report 
      ? new Date(report.report_month).toLocaleDateString("es", { month: "long", year: "numeric" })
      : "informe"
    pdf.save(`informe-${report?.site_name || "sitio"}-${monthName}.pdf`)
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="size-12 mx-auto text-destructive mb-4" />
            <h2 className="text-lg font-semibold mb-2">Informe no encontrado</h2>
            <Link href="/reports">
              <Button>Volver a informes</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  const reportData = report.report_data as ReportData | null
  const monthName = new Date(report.report_month).toLocaleDateString("es", { 
    month: "long", 
    year: "numeric" 
  })

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card print:hidden">
        <div className="container mx-auto px-4 py-4">
          <Link 
            href="/reports" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="size-4" />
            Volver a informes
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                Informe de {report.site_name || "Sitio"}
              </h1>
              <p className="text-muted-foreground">
                Periodo: {monthName}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportPDF}>
                <Download className="size-4 mr-2" />
                Exportar PDF
              </Button>
              {report.email_sent_at && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="size-4" />
                  Enviado: {new Date(report.email_sent_at).toLocaleDateString("es")}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8" ref={reportRef}>
        {/* Print header */}
        <div className="hidden print:block mb-8">
          <h1 className="text-2xl font-bold">Informe de Monitoreo</h1>
          <p className="text-lg">{report.site_name} - {monthName}</p>
          <p className="text-sm text-muted-foreground">{report.site_url}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Uptime"
            value={`${report.uptime_percentage?.toFixed(2)}%`}
            icon={Activity}
            trend={report.uptime_percentage >= 99 ? "up" : report.uptime_percentage >= 95 ? "neutral" : "down"}
          />
          <StatCard
            title="Tiempo Respuesta Promedio"
            value={`${report.avg_response_time_ms || "-"}ms`}
            icon={Clock}
            description={`Min: ${report.min_response_time_ms || "-"}ms / Max: ${report.max_response_time_ms || "-"}ms`}
          />
          <StatCard
            title="Total Chequeos"
            value={report.total_checks}
            icon={Activity}
            description={`Exitosos: ${report.successful_checks}`}
          />
          <StatCard
            title="Errores HTTP"
            value={report.error_4xx_count + report.error_5xx_count}
            icon={XCircle}
            description={`4xx: ${report.error_4xx_count} / 5xx: ${report.error_5xx_count}`}
            trend={(report.error_4xx_count + report.error_5xx_count) === 0 ? "up" : "down"}
          />
        </div>

        {/* Uptime Chart */}
        {reportData?.daily_stats && (
          <div className="mb-8">
            <UptimeChart 
              dailyStats={reportData.daily_stats.map(d => ({
                date: d.date,
                uptime: d.uptime,
                total_checks: d.checks_count,
                successful_checks: Math.round(d.checks_count * (d.uptime / 100))
              }))} 
              title="Uptime Diario"
            />
          </div>
        )}

        {/* Incidents */}
        {reportData?.incidents && reportData.incidents.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-warning" />
                Incidentes ({reportData.incidents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.incidents.map((incident, i) => (
                  <div 
                    key={i} 
                    className="p-4 rounded-lg bg-destructive/5 border border-destructive/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">
                        {new Date(incident.started_at).toLocaleString("es")}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Duracion: {incident.duration_minutes} minutos
                      </span>
                    </div>
                    {incident.error_message && (
                      <p className="text-sm text-destructive">{incident.error_message}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p>
                Durante el periodo de <strong>{monthName}</strong>, el sitio{" "}
                <strong>{report.site_name}</strong> registro un uptime de{" "}
                <strong className={report.uptime_percentage >= 99 ? "text-success" : ""}>
                  {report.uptime_percentage?.toFixed(2)}%
                </strong>{" "}
                con un tiempo de respuesta promedio de{" "}
                <strong>{report.avg_response_time_ms}ms</strong>.
              </p>
              <p>
                Se realizaron un total de <strong>{report.total_checks}</strong> chequeos,
                de los cuales <strong>{report.successful_checks}</strong> fueron exitosos.
              </p>
              {(report.error_4xx_count + report.error_5xx_count) > 0 && (
                <p>
                  Se detectaron <strong className="text-destructive">
                    {report.error_4xx_count + report.error_5xx_count} errores HTTP
                  </strong> ({report.error_4xx_count} errores 4xx y {report.error_5xx_count} errores 5xx).
                </p>
              )}
              {reportData?.incidents && reportData.incidents.length > 0 && (
                <p>
                  Hubo <strong className="text-warning">{reportData.incidents.length} incidentes</strong> durante el periodo.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
