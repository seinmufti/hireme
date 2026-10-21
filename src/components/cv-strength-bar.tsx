"use client"

import { useT } from "@/i18n/provider"
import { cvCompleteness, cvStrength, type CvTarget } from "@/lib/cv-strength"
import type { TalentInput, User } from "@/lib/types"
import { cn } from "@/lib/utils"

/**
 * Two bars (on Home, the CV page and the CV form): CV completeness (how much is filled in) and CV strength
 * (how convincing it is), each with the next thing to do. `onFix` opens the CV form at that part.
 * `skipPhoto`: don't suggest the photo (the CV page has a pencil on it); it still counts.
 */
export function CvStrengthBar({
  user,
  talent,
  onFix,
  skipPhoto,
  className,
}: {
  user: Pick<User, "photoId" | "title" | "phone" | "email" | "city" | "linkedin" | "address">
  talent: TalentInput | null
  onFix: (target: CvTarget) => void
  skipPhoto?: boolean
  className?: string
}) {
  const t = useT()
  const complete = cvCompleteness(user, talent, skipPhoto ? ["photo"] : [])
  const strength = cvStrength(user, talent, skipPhoto ? ["photo"] : [])
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2", className)}>
      <Meter
        label={t("home.cvCompleteness")}
        value={t("home.percentComplete", { percent: complete.percent })}
        percent={complete.percent}
        tip={complete.next && { text: t(`home.missing.${complete.next.key}`), target: complete.next.target }}
        onFix={onFix}
      />
      <Meter
        label={t("home.cvStrength")}
        value={`${strength.percent}%`}
        percent={strength.percent}
        tip={strength.next && { text: t(`home.quality.${strength.next.key}`), target: strength.next.target }}
        onFix={onFix}
      />
    </div>
  )
}

function Meter({
  label,
  value,
  percent,
  tip,
  onFix,
}: {
  label: string
  value: string
  percent: number
  tip: { text: string; target: CvTarget } | null
  onFix: (target: CvTarget) => void
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
      {tip && (
        <button type="button" onClick={() => onFix(tip.target)} className="block text-start text-sm text-primary hover:underline">
          {tip.text}
        </button>
      )}
    </div>
  )
}
