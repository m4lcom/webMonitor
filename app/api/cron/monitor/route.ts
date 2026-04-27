import { NextRequest, NextResponse } from "next/server"
import { runHealthChecks } from "@/lib/monitor"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const result = await runHealthChecks()
    
    return NextResponse.json({
      success: true,
      message: `Checked ${result.checked} sites, ${result.errors} errors`,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Cron monitor error:", error)
    return NextResponse.json(
      { error: "Failed to run health checks" },
      { status: 500 }
    )
  }
}
