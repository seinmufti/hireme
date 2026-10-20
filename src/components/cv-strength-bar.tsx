"use client"

import { useT } from "@/i18n/provider"
import { cvStrength, type StrengthTarget } from "@/lib/cv-strength"
import type { TalentInput, User } from "@/lib/types"
import { cn } from "@/lib/utils"

/**
 * "CV strength": a bar with the percentage and the next thing to add (on Home and the CV page).
 * `onFix` opens the CV form at that part.
 */
export function CvStrengthBar({
  user,
  talent,
  onFix,
  className,
}: {
  user: Pick<User, "photoId" | "title" | "phone" | "email" | "city">
  talent: TalentInput | null
  onFix: (target: StrengthTarget) => void
  className?: string
}) {
  const t = useT()
  const strength = cvStrength(user, talent)
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{t("home.cvStrength")}</span>
        <span className="tabular-nums text-muted-foreground">{strength.percent}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={strength.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("home.cvStrength")}
      >
        <div
          className={cn("h-full rounded-full transition-all", strength.percent >= 80 ? "bg-emerald-500" : strength.percent >= 50 ? "bg-amber-400" : "bg-primary")}
          style={{ width: `${strength.percent}%` }}
        />
      </div>
      {strength.next && (
        <button type="button" onClick={() => onFix(strength.next!.target)} className="block text-start text-sm text-primary hover:underline">
          {t(`home.strength.${strength.next.key}`)}
        </button>
      )}
    </div>
  )
}
