"use client"

import { useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { MonthlyReport } from "@/lib/types"
import { 
  ArrowLeft, 
  FileText, 
  RefreshCw,
  ExternalLink,
  Loader2
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

export default function ReportsPage() {
  const { data: reports, error, isLoading, mutate } = useSWR<ReportWithSite[]>(
    "/api/reports",
    fetcher
  )
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateReports = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error('Failed to generate reports')
      mutate()
    } catch (error) {
      console.error("Error generating reports:", error)
      alert("No se pudieron generar los informes")
    } finally {
      setIsGenerating(false)
    }
  }

  const formatMonth = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("es", { month: "long", year: "numeric" })
  }

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
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="size-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Informes Mensuales</h1>
                <p className="text-sm text-muted-foreground">
                  Historico de informes de monitoreo
                </p>
              </div>
            </div>
            <Button onClick={handleGenerateReports} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <RefreshCw className="size-4 mr-2" />
                  Generar informe
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Informes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : error ? (
              <p className="text-destructive text-center py-8">Error al cargar informes</p>
            ) : !reports || reports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="size-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No hay informes generados</p>
                <Button onClick={handleGenerateReports} disabled={isGenerating}>
                  Generar primer informe
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Periodo</TableHead>
                    <TableHead>Sitio</TableHead>
                    <TableHead>Uptime</TableHead>
                    <TableHead>Resp. Promedio</TableHead>
                    <TableHead>Checks</TableHead>
                    <TableHead>Errores</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        {formatMonth(report.report_month)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{report.site_name || "Sitio eliminado"}</span>
                          {report.site_url && (
                            <a
                              href={report.site_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                            >
                              {report.site_url}
                              <ExternalLink className="size-3" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={
                          report.uptime_percentage >= 99 
                            ? "text-success font-medium" 
                            : report.uptime_percentage >= 95 
                              ? "" 
                              : "text-destructive"
                        }>
                          {report.uptime_percentage?.toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell>{report.avg_response_time_ms || "-"}ms</TableCell>
                      <TableCell>{report.total_checks}</TableCell>
                      <TableCell>
                        <span className={
                          (report.error_4xx_count + report.error_5xx_count) > 0 
                            ? "text-destructive" 
                            : "text-muted-foreground"
                        }>
                          {report.error_4xx_count + report.error_5xx_count}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Link href={`/reports/${report.id}`}>
                          <Button variant="ghost" size="sm">
                            Ver detalle
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
