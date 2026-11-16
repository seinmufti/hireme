"use client"

import Link from "next/link"
import { CheckIcon } from "lucide-react"
import { useT } from "@/i18n/provider"
import { takesApplications } from "@/lib/jobs"
import type { Job } from "@/lib/types"
import { cn } from "@/lib/utils"
import { CompanyLink } from "@/components/company-link"
import { CompanyLogo } from "@/components/company-logo"
import { SaveJobButton } from "@/components/save-button"
import { QuickApply } from "./applications"
import { useJobFacts } from "./job-meta"
import { MatchDot } from "./match-ring"

/** One job in a list. For job seekers, `percent` is how well it matches their CV, in a filled circle at the top right. */
/** `applied` is the signed-in job seeker's application status, if they applied; `canApply` shows an Apply button. */
export function JobCard({
  job,
  percent,
  applied,
  canApply,
  canSave,
  className,
}: {
  job: Job
  percent?: number
  applied?: string
  canApply?: boolean
  canSave?: boolean
  className?: string
}) {
  const t = useT()
  const all = useJobFacts()(job)
  const facts = all.filter((f) => f.key === "location" || f.key === "salary" || f.key === "contract")
  const dates = all.filter((f) => f.key === "posted" || f.key === "deadline")
  // Applied: beside the title on a wide card, under the company on a narrow one (phones)
  const tag = applied ? (
    <span className="flex shrink-0 items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-900">
      <CheckIcon className="size-3" /> {t("jobs.applied")}
    </span>
  ) : null
  return (
    <article
      className={cn(
        "@container relative flex flex-col rounded-xl border bg-card p-4 shadow-xs sm:p-5 transition hover:border-primary/30 hover:shadow-sm",
        !takesApplications(job) && "opacity-70",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
        <CompanyLink employerId={job.employerId} label={job.company} className="shrink-0">
          <CompanyLogo employerId={job.employerId} name={job.company} size={44} />
        </CompanyLink>
        <div className="min-w-0">
          {/* Long titles wrap to a second line instead of being cut off next to the match tag */}
          <h3 className="line-clamp-2 font-semibold leading-snug">
            {/* The whole card opens the job */}
            <Link href={`/jobs/${job.id}`} className="after:absolute after:inset-0 hover:underline">
              {job.title}
            </Link>
          </h3>
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
            <CompanyLink employerId={job.employerId}>{job.company}</CompanyLink> · {job.category}
          </p>
          {tag && <div className="mt-1.5 flex @sm:hidden">{tag}</div>}
        </div>
        </div>
        {tag && <span className="hidden shrink-0 @sm:flex">{tag}</span>}
        {percent !== undefined && <MatchDot percent={percent} />}
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

      <p className="mt-3 text-xs text-muted-foreground">
        {dates.map((f, i) => (
          <span key={f.key} title={f.hint}>
            {i > 0 && " · "}
            {f.value}
          </span>
        ))}
      </p>
      {/* Above the card's link, so it can be pressed */}
      {(canApply || canSave) && (
        <div className="relative z-10 mt-4 flex items-center gap-2">
          {canApply && !applied && <QuickApply job={job} />}
          {canSave && <SaveJobButton jobId={job.id} className="ms-auto" />}
        </div>
      )}
    </article>
  )
}
