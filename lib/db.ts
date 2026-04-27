import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  console.warn("WARNING: DATABASE_URL is not defined. Database features will fail.")
}

export const sql = neon(process.env.DATABASE_URL || "")
