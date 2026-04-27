"use client"

import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "./status-badge"
import type { SiteWithStats } from "@/lib/types"
import { ExternalLink, MoreHorizontal, Trash2, Settings } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SitesTableProps {
  sites: SiteWithStats[]
  onDelete?: (id: number) => void
}

export function SitesTable({ sites, onDelete }: SitesTableProps) {
  const formatResponseTime = (ms: number | null | undefined) => {
    if (ms === null || ms === undefined) return "-"
    return `${ms}ms`
  }

  const formatUptime = (uptime: number | null | undefined) => {
    if (uptime === null || uptime === undefined) return "-"
    return `${uptime.toFixed(2)}%`
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleString()
  }

  if (sites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground mb-4">No hay sitios configurados</p>
        <Link href="/sites/new">
          <Button>Agregar primer sitio</Button>
        </Link>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sitio</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Uptime (24h)</TableHead>
          <TableHead>Respuesta</TableHead>
          <TableHead>Ultimo chequeo</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sites.map((site) => (
          <TableRow key={site.id}>
            <TableCell>
              <div className="flex flex-col">
                <Link 
                  href={`/sites/${site.id}`}
                  className="font-medium hover:underline"
                >
                  {site.name}
                </Link>
                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  {site.url}
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </TableCell>
            <TableCell>
              <StatusBadge isUp={site.last_check?.is_up ?? false} />
            </TableCell>
            <TableCell>
              <span className={site.uptime_24h && site.uptime_24h >= 99 ? "text-success font-medium" : ""}>
                {formatUptime(site.uptime_24h)}
              </span>
            </TableCell>
            <TableCell>{formatResponseTime(site.avg_response_time_24h)}</TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {formatDate(site.last_check?.checked_at)}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8">
                    <MoreHorizontal className="size-4" />
                    <span className="sr-only">Abrir menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/sites/${site.id}`}>
                      <Settings className="size-4 mr-2" />
                      Ver detalles
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => onDelete?.(site.id)}
                  >
                    <Trash2 className="size-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
