"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface DailyStat {
  date: string
  uptime: number | null
  total_checks: number
  successful_checks: number
}

interface UptimeChartProps {
  dailyStats: DailyStat[]
  title?: string
}

export function UptimeChart({ dailyStats, title = "Uptime Diario" }: UptimeChartProps) {
  const data = [...dailyStats]
    .reverse()
    .map((stat) => ({
      date: new Date(stat.date).toLocaleDateString("es", {
        day: "2-digit",
        month: "short",
      }),
      uptime: Number(stat.uptime || 0),
      checks: stat.total_checks,
    }))

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No hay datos disponibles
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="date"
                stroke="var(--color-muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--color-muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const uptime = payload[0].value as number
                    return (
                      <div className="bg-popover border rounded-lg p-2 shadow-md">
                        <p className="text-sm font-medium">{payload[0].payload.date}</p>
                        <p className="text-sm text-muted-foreground">
                          Uptime: {Number(uptime).toFixed(2)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payload[0].payload.checks} checks
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar
                dataKey="uptime"
                radius={[4, 4, 0, 0]}
                fill="var(--color-chart-1)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
