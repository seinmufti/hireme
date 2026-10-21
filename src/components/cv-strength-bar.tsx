"use client"

import { useT } from "@/i18n/provider"
import { cvCompleteness, cvStrength } from "@/lib/cv-strength"
import type { TalentInput, User } from "@/lib/types"
import { cn } from "@/lib/utils"

/**
 * Two bars (on Home, the CV page and the CV form): CV completeness (how much is filled in) and CV strength
 * (how convincing it is).
 * `skipPhoto`: don't suggest the photo (the CV page has a pencil on it); it still counts.
 */
export function CvStrengthBar({
  user,
  talent,
  skipPhoto,
  className,
}: {
  user: Pick<User, "photoId" | "title" | "phone" | "email" | "city" | "linkedin" | "address">
  talent: TalentInput | null
  skipPhoto?: boolean
  className?: string
}) {
  const t = useT()
  const complete = cvCompleteness(user, talent, skipPhoto ? ["photo"] : [])
  const strength = cvStrength(user, talent, skipPhoto ? ["photo"] : [])
  return (
    <div className={cn("space-y-4", className)}>
      <Meter
        label={t("home.cvCompleteness")}
        value={t("home.percentComplete", { percent: complete.percent })}
        percent={complete.percent}
      />
      <Meter
        label={t("home.cvStrength")}
        value={`${strength.percent}%`}
        percent={strength.percent}
      />
    </div>
  )
}

function Meter({
  label,
  value,
  percent,
}: {
  label: string
  value: string
  percent: number
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div
          className={cn("h-full rounded-full transition-all", percent >= 80 ? "bg-emerald-500" : percent >= 50 ? "bg-amber-400" : "bg-primary")}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
