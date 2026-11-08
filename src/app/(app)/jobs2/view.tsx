"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CompanyLogo } from "@/components/company-logo"
import { WorkPreferenceButton } from "@/components/home/work-preference"
import { JobBrowser } from "@/components/jobs/job-browser"
import { JobDetail } from "@/components/jobs/job-detail"
import { useDeadlineLabel } from "@/components/jobs/job-meta"
import { MatchRing } from "@/components/jobs/match-ring"
import { useT, useTimeAgo } from "@/i18n/provider"
import { matchPercent } from "@/lib/matching"
import { ANYONE } from "@/lib/options"
import { useStore } from "@/lib/store"
import type { Job, User } from "@/lib/types"
import { useMyTalent } from "@/lib/use-my-talent"
import { useRoleGuard } from "@/lib/use-role-guard"
import { cn } from "@/lib/utils"

/**
 * Jobs 2 (a trial layout): the same heading, search and filters as Jobs; under "n of n jobs" the main section: the
 * jobs as a list on the left and the job picked open beside it.
 */
export function Jobs2View() {
  const viewer = useRoleGuard(ANYONE)
  const t = useT()
  const jobs = useStore((s) => s.jobs)
  const talent = useMyTalent()
  if (!viewer) return null
  return (
    <JobBrowser
      key={viewer.id}
      jobs={jobs}
      role={viewer.role}
      talent={talent}
      initialQuery=""
      title={t("nav.jobs2")}
      renderResults={(results, countLabel) => <SplitResults results={results} countLabel={countLabel} viewer={viewer} talent={talent} />}
      // The work they want, among the filters (also makes the top one compact bar)
      filterExtra={viewer.role === "SEEKER" ? <WorkPreferenceButton user={viewer} talent={talent} /> : null}
    />
  )
}

/** The list (left) and the job picked (right). Phones: the list; a job opens its page. */
function SplitResults({ results, countLabel, viewer, talent }: { results: Job[]; countLabel: string; viewer: User; talent: ReturnType<typeof useMyTalent> }) {
  const t = useT()
  const router = useRouter()
  const timeAgo = useTimeAgo()
  const deadline = useDeadlineLabel()
  const [picked, setPicked] = useState<string | null>(null)
  const isSeeker = viewer.role === "SEEKER"
  // The job's side: back to its top when another job is picked
  const detailRef = useRef<HTMLDivElement>(null)
  const pick = (id: string) => {
    setPicked(id)
    detailRef.current?.scrollTo({ top: 0 })
  }
  const job = results.find((j) => j.id === picked) ?? results[0] ?? null

  return (
    // One panel, like LinkedIn: the list and the job side by side, each scrolling on its own
    <div className="overflow-hidden rounded-xl border bg-card lg:sticky lg:top-[calc(3.5rem+var(--bar-h)+1rem)] lg:grid lg:h-[calc(100dvh-3.5rem-var(--bar-h)-7rem)] lg:grid-cols-[22rem_minmax(0,1fr)]">
      <nav className="no-scrollbar divide-y lg:overflow-y-auto lg:border-e" aria-label={t("nav.jobs")}>
        {/* How many jobs, as the list's heading (wide screens; phones have it above) */}
        <p className="hidden bg-muted/40 px-4 py-2.5 text-xs font-medium text-muted-foreground lg:block">{countLabel}</p>
        {results.map((j) => {
          const active = job?.id === j.id
          return (
            <button
              key={j.id}
              type="button"
              onClick={() => (window.matchMedia("(min-width: 1024px)").matches ? pick(j.id) : router.push(`/jobs/${j.id}`))}
              aria-current={active || undefined}
              className={cn(
                "flex w-full items-start gap-3 border-s-[3px] px-4 py-3.5 text-start transition hover:bg-muted/60",
                active ? "border-s-primary bg-brand-soft/60" : "border-s-transparent"
              )}
            >
              <CompanyLogo employerId={j.employerId} name={j.company} size={44} />
              {/* Position, company, type and when it was posted, the deadline */}
              <span className="min-w-0 flex-1">
                <span className={cn("line-clamp-2 block text-sm leading-snug font-semibold", active ? "text-primary" : "text-blue-800")}>{j.title}</span>
                <span className="block truncate text-sm">{j.company}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {j.contractType} · {t("jobs.posted", { time: timeAgo(j.createdAt) })}
                </span>
                <span className="block text-xs text-muted-foreground">{deadline(j)}</span>
              </span>
              {isSeeker && talent && <MatchRing percent={matchPercent(talent, j)} size={36} />}
            </button>
          )
        })}
      </nav>

      {/* The job picked (wide screens) */}
      <div ref={detailRef} className="hidden min-w-0 lg:block lg:overflow-y-auto">
        {job && <JobDetail key={job.id} job={job} viewer={viewer} talent={talent} pane />}
      </div>
    </div>
  )
}
