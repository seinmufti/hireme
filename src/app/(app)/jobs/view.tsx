"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { JobBrowser } from "@/components/jobs/job-browser"
import { JobDetail } from "@/components/jobs/job-detail"
import { JobListCard } from "@/components/jobs/job-list-card"
import { useT } from "@/i18n/provider"
import { ANYONE } from "@/lib/options"
import { useStore } from "@/lib/store"
import type { Job, User } from "@/lib/types"
import { useMyTalent } from "@/lib/use-my-talent"
import { useRoleGuard } from "@/lib/use-role-guard"
import { cn } from "@/lib/utils"

/**
 * Jobs: the heading, one bar with the search and filters, and under it the jobs as a list on the left with the job
 * picked open beside it (phones: under its card). Employers don't search jobs: they're sent to their own posts.
 */
export function JobsView({ initialQuery, welcome }: { initialQuery: string; welcome?: boolean }) {
  const viewer = useRoleGuard(ANYONE)
  const jobs = useStore((s) => s.jobs)
  const talent = useMyTalent()
  const router = useRouter()
  const isEmployer = viewer?.role === "EMPLOYER"
  useEffect(() => {
    if (isEmployer) router.replace("/jobs/mine")
  }, [isEmployer, router])
  if (!viewer || isEmployer) return null
  return (
    <JobBrowser
      key={viewer.id}
      jobs={jobs}
      role={viewer.role}
      talent={talent}
      initialQuery={initialQuery}
      welcome={welcome && viewer.role === "SEEKER"}
      renderResults={(results, extras) => <SplitResults results={results} {...extras} viewer={viewer} talent={talent} />}
      // Nothing extra among the filters; giving it makes the top one compact bar
      filterExtra={null}
    />
  )
}

/** The list (left) and the job picked (right). Phones: the list; a job opens its page. */
function SplitResults({
  results,
  countLabel,
  savedFilter,
  sort,
  clearFilters,
  viewer,
  talent,
}: {
  results: Job[]
  countLabel: string
  savedFilter: React.ReactNode
  sort: React.ReactNode
  clearFilters: (() => void) | null
  viewer: User
  talent: ReturnType<typeof useMyTalent>
}) {
  const t = useT()
  const [picked, setPicked] = useState<string | null>(null)
  const isSeeker = viewer.role === "SEEKER"
  // The job's side: back to its top when another job is picked
  const detailRef = useRef<HTMLDivElement>(null)
  const pick = (id: string) => {
    setPicked(id)
    detailRef.current?.scrollTo({ top: 0 })
  }
  const job = results.find((j) => j.id === picked) ?? results[0] ?? null
  // Phones: the job opens under its card (tap again to close)
  const [expanded, setExpanded] = useState<string | null>(null)
  const open = (id: string) => {
    if (window.matchMedia("(min-width: 1024px)").matches) return pick(id)
    const next = expanded === id ? null : id
    setExpanded(next)
    // Keep the card in view (the one open before it may have been above it)
    if (next) requestAnimationFrame(() => document.getElementById(`job-${id}`)?.scrollIntoView({ block: "start", behavior: "smooth" }))
  }

  return (
    // One panel, like LinkedIn: the list and the job side by side, each scrolling on its own
    <div className="lg:sticky lg:overflow-hidden lg:rounded-xl lg:border lg:bg-card lg:top-[calc(3.5rem+var(--bar-h)+1rem)] lg:grid lg:-mb-20 lg:h-[calc(100dvh-var(--bar-h)-10.5625rem)] lg:grid-cols-[22rem_minmax(0,1fr)]">
      <nav className="no-scrollbar space-y-2 lg:overflow-y-auto lg:border-e lg:bg-muted/30 lg:px-3 lg:pb-3" aria-label={t("nav.jobs")}>
        {/* The list's heading: how many jobs (wide screens; phones have it above) and the Saved filter */}
        <div className="flex items-center justify-between gap-2 px-1 pt-3">
          <p className="hidden text-xs font-medium text-muted-foreground lg:block">{countLabel}</p>
          <div className="flex items-center gap-2">
            {sort}
            {savedFilter}
          </div>
        </div>
        {results.length === 0 && (
          <div className="rounded-xl border border-dashed bg-card px-4 py-10 text-center text-sm">
            <p className="font-medium">{t("jobs.noResults")}</p>
            {clearFilters && (
              <button type="button" onClick={clearFilters} className="mt-2 text-blue-700 underline underline-offset-4">
                {t("common.clearFilters")}
              </button>
            )}
          </div>
        )}
        {results.map((j) => {
          const active = job?.id === j.id
          const isOpen = expanded === j.id
          return (
            <div key={j.id} id={`job-${j.id}`} className="scroll-mt-32 space-y-2">
            <JobListCard
              job={j}
              onOpen={() => open(j.id)}
              talent={talent}
              isSeeker={isSeeker}
              expanded={isOpen}
              current={active || isOpen}
              // Wide screens: the job open beside the list; phones: the one open under its card
              activeClass={cn(active && "lg:border-primary/60 lg:bg-brand-soft/60 lg:ring-1 lg:ring-primary/30", isOpen && "border-primary/60 bg-brand-soft/60 ring-1 ring-primary/30")}
              titleClass={cn(active && "lg:text-primary", isOpen && "text-primary")}
            />
            {/* Phones: the job, under its card */}
            {isOpen && (
              <div className="overflow-hidden rounded-xl border bg-card lg:hidden">
                <JobDetail job={j} viewer={viewer} talent={talent} pane />
              </div>
            )}
            </div>
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
