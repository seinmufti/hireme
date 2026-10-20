"use client"

import Link from "next/link"
import { CheckIcon, SparklesIcon } from "lucide-react"
import { useT } from "@/i18n/provider"
import type { Job } from "@/lib/types"
import { cn } from "@/lib/utils"
import { SkillChips, useJobFacts } from "./job-meta"

/** One job in a list. `match` marks jobs that suit the signed-in job seeker. */
/** `applied` is the signed-in job seeker's application status, if they applied. */
export function JobCard({
  job,
  match,
  have,
  applied,
  className,
}: {
  job: Job
  match?: boolean
  have?: string[]
  applied?: string
  className?: string
}) {
  const t = useT()
  const facts = useJobFacts()(job).filter((f) => f.key !== "company" && f.key !== "category")
  return (
    <article
      className={cn(
        "relative flex flex-col rounded-xl border bg-card p-5 shadow-xs transition hover:border-primary/30 hover:shadow-sm",
        !job.open && "opacity-70",
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
        ) : match && (
          <span className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-900">
            <SparklesIcon className="size-3" /> {t("jobs.matchesYou")}
          </span>
        )}
        {!job.open && <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{t("jobs.closed")}</span>}
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
    </article>
  )
}
