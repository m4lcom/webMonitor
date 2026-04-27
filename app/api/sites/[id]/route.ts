import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const siteId = parseInt(id)
    
    if (isNaN(siteId)) {
      return NextResponse.json({ error: "Invalid site ID" }, { status: 400 })
    }
    
    const sites = await sql`SELECT * FROM sites WHERE id = ${siteId}`
    
    if (sites.length === 0) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }
    
    return NextResponse.json(sites[0])
  } catch (error) {
    console.error("Error fetching site:", error)
    return NextResponse.json({ error: "Failed to fetch site" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const siteId = parseInt(id)
    const body = await request.json()
    
    if (isNaN(siteId)) {
      return NextResponse.json({ error: "Invalid site ID" }, { status: 400 })
    }
    
    const { name, url, check_interval, is_active } = body
    
    const result = await sql`
      UPDATE sites 
      SET 
        name = COALESCE(${name}, name),
        url = COALESCE(${url}, url),
        check_interval = COALESCE(${check_interval}, check_interval),
        is_active = COALESCE(${is_active}, is_active),
        updated_at = NOW()
      WHERE id = ${siteId}
      RETURNING *
    `
    
    if (result.length === 0) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }
    
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating site:", error)
    return NextResponse.json({ error: "Failed to update site" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const siteId = parseInt(id)
    
    if (isNaN(siteId)) {
      return NextResponse.json({ error: "Invalid site ID" }, { status: 400 })
    }
    
    const result = await sql`
      DELETE FROM sites WHERE id = ${siteId} RETURNING id
    `
    
    if (result.length === 0) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting site:", error)
    return NextResponse.json({ error: "Failed to delete site" }, { status: 500 })
  }
}
