"use client"

import { MapPinIcon } from "lucide-react"
import { CompanyLogo } from "@/components/company-logo"
import { countryName } from "@/components/home/home-data"
import { SaveJobButton } from "@/components/save-button"
import { useI18n, useLocationLabel, useT, useTimeAgo } from "@/i18n/provider"
import { matchPercent, type MatchableTalent } from "@/lib/matching"
import type { Job } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useDeadlineLabel } from "./job-meta"
import { MatchRing } from "./match-ring"

/**
 * One job in a list beside something else (the Jobs tab, a company's page): its logo, title, company, where, the
 * contract and when it was posted, the deadline; for job seekers the match and Save. The whole card opens it.
 * `active` marks it (classes, e.g. "lg:..." to mark it on wide screens only).
 */
export function JobListCard({
  job,
  onOpen,
  talent,
  isSeeker,
  activeClass,
  titleClass,
  expanded,
  current,
}: {
  job: Job
  onOpen: () => void
  talent: MatchableTalent | null
  isSeeker: boolean
  /** Classes for the card when it's the one open */
  activeClass?: string
  /** Classes for the title when it's the one open */
  titleClass?: string
  expanded?: boolean
  current?: boolean
}) {
  const t = useT()
  const timeAgo = useTimeAgo()
  const deadline = useDeadlineLabel()
  const { locale } = useI18n()
  const locationLabel = useLocationLabel()
  // "Erbil, Iraq"; remote and international jobs say so
  const l = job.location
  const place = l.iraqCity && !l.remote && !l.international ? `${l.iraqCity}, ${countryName("IQ", locale)}` : locationLabel(l)
  return (
    // A div acting as a button, so the Save button can sit inside it
    <div
      role="button"
      aria-expanded={expanded}
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onOpen()
        }
      }}
      aria-current={current || undefined}
      className={cn(
        // Each job its own card, apart from the others
        "flex w-full cursor-pointer items-start gap-3 rounded-xl border bg-card px-4 py-3 text-start shadow-xs transition outline-none hover:border-primary/30 hover:shadow-sm focus-visible:ring-3 focus-visible:ring-ring/50",
        activeClass
      )}
    >
      <CompanyLogo employerId={job.employerId} name={job.company} size={44} />
      {/* Position, company, where, type and when it was posted, the deadline */}
      <span className="min-w-0 flex-1">
        <span className={cn("line-clamp-2 block text-sm leading-snug font-semibold text-blue-800", titleClass)}>{job.title}</span>
        <span className="block truncate text-sm">{job.company}</span>
        <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
          <MapPinIcon className="size-3 shrink-0" /> {place}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {job.contractType} · {t("jobs.posted", { time: timeAgo(job.createdAt) })}
        </span>
        <span className="block text-xs text-muted-foreground">{deadline(job)}</span>
      </span>
      {/* The match, and Save under it */}
      <span className="flex shrink-0 flex-col items-center gap-2">
        {isSeeker && talent && <MatchRing percent={matchPercent(talent, job)} size={36} />}
        {isSeeker && (
          <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <SaveJobButton jobId={job.id} />
          </span>
        )}
      </span>
    </div>
  )
}
