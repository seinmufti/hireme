"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

/** A percentage as a ring that fills up, with the number in the middle; `animate`: it fills from empty when it appears. */
export function MatchRing({ percent, size = 40, className, animate }: { percent: number; size?: number; className?: string; animate?: boolean }) {
  const [shown, setShown] = useState(!animate)
  useEffect(() => {
    if (!animate) return
    const frame = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(frame)
  }, [animate])
  const stroke = Math.max(3, Math.round(size / 11))
  const r = (size - stroke) / 2
  const length = 2 * Math.PI * r
  const value = Math.min(100, Math.max(0, percent))
  // Green for a strong match, amber for some, grey for little
  const color = value >= 60 ? "text-emerald-600" : value >= 30 ? "text-amber-500" : "text-muted-foreground"
  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke="currentColor"
          strokeDasharray={length}
          strokeDashoffset={length * (1 - (shown ? value : 0) / 100)}
          className={cn("transition-[stroke-dashoffset] duration-700", color)}
        />
      </svg>
      <span className="absolute font-semibold tabular-nums" style={{ fontSize: Math.max(10, size * 0.27) }}>
        {value}%
      </span>
    </span>
  )
}

/** A percentage in a filled circle (job cards): green for a strong match, amber for some, grey for little. */
export function MatchDot({ percent, size = 44, className }: { percent: number; size?: number; className?: string }) {
  const value = Math.min(100, Math.max(0, Math.round(percent)))
  const color = value >= 60 ? "bg-emerald-600 text-white" : value >= 30 ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold tabular-nums shadow-xs", color, className)}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.27) }}
    >
      {value}%
    </span>
  )
}
