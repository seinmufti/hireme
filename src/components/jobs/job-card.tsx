"use client"

import Link from "next/link"
import { CheckIcon, TargetIcon } from "lucide-react"
import { useT } from "@/i18n/provider"
import { takesApplications } from "@/lib/jobs"
import type { Job } from "@/lib/types"
import { cn } from "@/lib/utils"
import { QuickApply } from "./applications"
import { SkillChips, useJobFacts } from "./job-meta"

/** "3 matches" / "1 match" */
export function useMatchLabel() {
  const t = useT()
  return (count: number) => (count === 1 ? t("jobs.matchOne") : t("jobs.matchCount", { count }))
}

/**
 * One job in a list. For job seekers, `matches` is how many things match their CV (no tag when left out);
 * `isMatch` colours the tag green when the job is a match for them.
 */
/** `applied` is the signed-in job seeker's application status, if they applied; `canApply` shows an Apply button. */
export function JobCard({
  job,
  matches,
  isMatch,
  have,
  applied,
  canApply,
  className,
}: {
  job: Job
  matches?: number
  isMatch?: boolean
  have?: string[]
  applied?: string
  canApply?: boolean
  className?: string
}) {
  const t = useT()
  const matchLabel = useMatchLabel()
  const facts = useJobFacts()(job).filter((f) => f.key !== "company" && f.key !== "category")
  return (
    <article
      className={cn(
        "relative flex flex-col rounded-xl border bg-card p-5 shadow-xs transition hover:border-primary/30 hover:shadow-sm",
        !takesApplications(job) && "opacity-70",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">
            {/* The whole card opens the job */}
            <Link href={`/jobs/${job.id}`} className="after:absolute after:inset-0 hover:underline">
              {job.title}
            </Link>
          </h3>
          <p className="truncate text-sm text-muted-foreground">
            {job.company} · {job.category}
          </p>
        </div>
        {applied ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-900">
            <CheckIcon className="size-3" /> {t("jobs.applied")}
          </span>
        ) : matches !== undefined && (
          <span
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
              isMatch ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "bg-muted text-muted-foreground"
            )}
          >
            <TargetIcon className="size-3" /> {matchLabel(matches)}
          </span>
        )}
        {!takesApplications(job) && <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{t("jobs.closed")}</span>}
      </div>

      <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {facts.map((f) => (
          <div key={f.key} className="flex items-center gap-1.5">
            <f.icon className="size-3.5 shrink-0" />
            <dt className="sr-only">{f.label}</dt>
            <dd>{f.value}</dd>
          </div>
        ))}
      </dl>

      <SkillChips skills={job.skills} have={have} limit={5} className="mt-4" />
      {/* Above the card's link, so it can be pressed */}
      {canApply && !applied && <QuickApply job={job} className="relative z-10 mt-4 self-start" />}
    </article>
  )
}
