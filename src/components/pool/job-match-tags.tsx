"use client"

import { CheckIcon, XIcon } from "lucide-react"
import { MatchRing } from "@/components/jobs/match-ring"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useT } from "@/i18n/provider"
import { matchDetails, matchPercent, type MatchableTalent } from "@/lib/matching"
import { useStore } from "@/lib/store"
import type { Job } from "@/lib/types"
import { cn } from "@/lib/utils"

/**
 * Employers, on a job seeker's card in the Pool: how well they match each of the employer's jobs (not closed), best first.
 * Each is a tag with the job's name and a match circle that fills up; hovering it shows why. Two show (one on a narrow
 * card); the rest are behind a "+N" that lists them on hover.
 */
export function JobMatchTags({ talent, className }: { talent: MatchableTalent; className?: string }) {
  const t = useT()
  const me = useStore((s) => s.users.find((u) => u.id === s.currentUserId))
  const allJobs = useStore((s) => s.jobs)
  if (me?.role !== "EMPLOYER") return null
  const mine = allJobs
    // Every job they haven't closed (also ones past their last day, which they may reopen)
    .filter((j) => j.employerId === me.id && j.open)
    .map((job) => ({ job, percent: matchPercent(talent, job) }))
    .sort((a, b) => b.percent - a.percent)
  if (!mine.length) return null

  const more = (from: number) =>
    mine.length > from && (
      <Tooltip>
        <TooltipTrigger
          className={cn(
            "flex h-8 shrink-0 items-center rounded-full border bg-background px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted",
            from === 1 ? "@lg:hidden" : "hidden @lg:flex"
          )}
          aria-label={t("pool.moreMatches", { count: mine.length - from })}
        >
          +{mine.length - from}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="flex-col items-stretch gap-1 py-2">
          {mine.slice(from).map(({ job, percent }) => (
            <span key={job.id} className="flex items-center justify-between gap-4">
              <span className="truncate">{job.title}</span>
              <span className="font-semibold tabular-nums">{percent}%</span>
            </span>
          ))}
        </TooltipContent>
      </Tooltip>
    )

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {mine.slice(0, 2).map(({ job, percent }, i) => (
        <Tooltip key={job.id}>
          <TooltipTrigger
            className={cn(
              "h-8 min-w-0 max-w-44 shrink items-center gap-1.5 rounded-full border bg-background ps-2.5 pe-0.5 text-xs font-medium hover:border-primary/30",
              i === 0 ? "flex" : "hidden @lg:flex"
            )}
          >
            <span className="truncate">{job.title}</span>
            <MatchRing percent={percent} size={28} animate className="shrink-0" />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="flex-col items-stretch gap-1 py-2">
            <WhyItMatches talent={talent} job={job} percent={percent} />
          </TooltipContent>
        </Tooltip>
      ))}
      {more(1)}
      {more(2)}
    </div>
  )
}

/** Why the job seeker matches the job: its skills they have, its field, a similar job title, its languages. */
function WhyItMatches({ talent, job, percent }: { talent: MatchableTalent; job: Job; percent: number }) {
  const t = useT()
  const { skills, category, title, languages } = matchDetails(talent, job)
  const rows = [
    { ok: skills.length > 0, label: t("jobs.matchSkills", { have: skills.length, total: job.skills.length }) },
    { ok: category, label: t("jobs.matchField") },
    { ok: title, label: t("jobs.matchTitle") },
    ...(job.languages?.length ? [{ ok: languages.length > 0, label: t("jobs.matchLanguages", { have: languages.length, total: job.languages.length }) }] : []),
  ]
  return (
    <>
      <span className="flex items-center justify-between gap-4 font-semibold">
        <span className="truncate">{job.title}</span>
        <span className="tabular-nums">{percent}%</span>
      </span>
      {rows.map((r) => (
        <span key={r.label} className={cn("flex items-center gap-1.5", !r.ok && "opacity-60")}>
          {r.ok ? <CheckIcon className="size-3 text-emerald-400" /> : <XIcon className="size-3" />} {r.label}
        </span>
      ))}
    </>
  )
}
