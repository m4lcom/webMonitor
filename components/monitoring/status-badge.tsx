"use client"

import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  isUp: boolean
  className?: string
}

export function StatusBadge({ isUp, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        isUp
          ? "bg-success/10 text-success"
          : "bg-destructive/10 text-destructive",
        className
      )}
    >
      <span
        className={cn(
          "size-2 rounded-full",
          isUp ? "bg-success animate-pulse" : "bg-destructive"
        )}
      />
      {isUp ? "Online" : "Offline"}
    </span>
  )
}
