"use client"

import { BookmarkIcon, HeartIcon } from "lucide-react"
import { useT } from "@/i18n/provider"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

/** A heart that saves a job for later (job seekers). `withLabel` adds "Save" / "Saved" next to it. */
export function SaveJobButton({ jobId, withLabel, className }: { jobId: string; withLabel?: boolean; className?: string }) {
  const t = useT()
  const saved = useStore((s) => s.savedJobs.some((x) => x.userId === s.currentUserId && x.id === jobId))
  const toggle = useStore((s) => s.toggleSavedJob)
  return (
    <SaveToggle saved={saved} onToggle={() => toggle(jobId)} icon={HeartIcon} label={saved ? t("common.savedForLater") : t("common.saveForLater")} withLabel={withLabel} className={className} />
  )
}

/** A bookmark that saves a job seeker for later (employers and recruiters, in the Pool). */
export function SaveTalentButton({ talentId, className }: { talentId: string; className?: string }) {
  const t = useT()
  const saved = useStore((s) => s.savedTalents.some((x) => x.userId === s.currentUserId && x.id === talentId))
  const toggle = useStore((s) => s.toggleSavedTalent)
  return <SaveToggle saved={saved} onToggle={() => toggle(talentId)} icon={BookmarkIcon} label={saved ? t("common.savedForLater") : t("common.saveForLater")} className={className} />
}

function SaveToggle({
  saved,
  onToggle,
  icon: Icon,
  label,
  withLabel,
  className,
}: {
  saved: boolean
  onToggle: () => void
  icon: typeof HeartIcon
  label: string
  withLabel?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={label}
      title={label}
      onClick={onToggle}
      className={cn(
        "flex shrink-0 items-center justify-center gap-1.5 rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground",
        withLabel ? "h-8 border px-3 text-sm" : "size-8",
        saved && "text-primary hover:text-primary",
        className
      )}
    >
      <Icon className={cn("size-4", saved && "fill-current")} />
      {withLabel && label}
    </button>
  )
}
