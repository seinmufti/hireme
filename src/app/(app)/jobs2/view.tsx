"use client"

import { useRef, useState } from "react"
import { CompanyLogo } from "@/components/company-logo"
import { SaveJobButton } from "@/components/save-button"
import { WorkPreferenceButton } from "@/components/home/work-preference"
import { JobBrowser } from "@/components/jobs/job-browser"
import { JobDetail } from "@/components/jobs/job-detail"
import { useDeadlineLabel } from "@/components/jobs/job-meta"
import { MatchRing } from "@/components/jobs/match-ring"
import { useI18n, useLocationLabel, useT, useTimeAgo } from "@/i18n/provider"
import { countryName } from "@/components/home/home-data"
import { MapPinIcon } from "lucide-react"
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
      renderResults={(results, extras) => <SplitResults results={results} {...extras} viewer={viewer} talent={talent} />}
      // The work they want, among the filters (also makes the top one compact bar)
      filterExtra={viewer.role === "SEEKER" ? <WorkPreferenceButton user={viewer} talent={talent} /> : null}
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
  const timeAgo = useTimeAgo()
  const deadline = useDeadlineLabel()
  const { locale } = useI18n()
  const locationLabel = useLocationLabel()
  // "Erbil, Iraq"; remote and international jobs say so
  const place = (j: Job) => (j.location.iraqCity && !j.location.remote && !j.location.international ? `${j.location.iraqCity}, ${countryName("IQ", locale)}` : locationLabel(j.location))
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
    <div className="lg:sticky lg:overflow-hidden lg:rounded-xl lg:border lg:bg-card lg:top-[calc(3.5rem+var(--bar-h)+1rem)] lg:grid lg:h-[calc(100dvh-3.5rem-var(--bar-h)-7rem)] lg:grid-cols-[22rem_minmax(0,1fr)]">
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
            {/* A div acting as a button, so the Save button can sit inside it */}
            <div
              role="button"
              aria-expanded={isOpen}
              tabIndex={0}
              onClick={() => open(j.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  open(j.id)
                }
              }}
              aria-current={active || isOpen || undefined}
              className={cn(
                // Each job its own card, apart from the others
                "flex w-full cursor-pointer items-start gap-3 rounded-xl border bg-card px-4 py-3 text-start shadow-xs transition outline-none hover:border-primary/30 hover:shadow-sm focus-visible:ring-3 focus-visible:ring-ring/50",
                // Wide screens: the job open beside the list; phones: the one open under its card
                active && "lg:border-primary/60 lg:bg-brand-soft/60 lg:ring-1 lg:ring-primary/30",
                isOpen && "border-primary/60 bg-brand-soft/60 ring-1 ring-primary/30"
              )}
            >
              <CompanyLogo employerId={j.employerId} name={j.company} size={44} />
              {/* Position, company, type and when it was posted, the deadline */}
              <span className="min-w-0 flex-1">
                <span className={cn("line-clamp-2 block text-sm leading-snug font-semibold text-blue-800", active && "lg:text-primary", isOpen && "text-primary")}>{j.title}</span>
                <span className="block truncate text-sm">{j.company}</span>
                <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <MapPinIcon className="size-3 shrink-0" /> {place(j)}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {j.contractType} · {t("jobs.posted", { time: timeAgo(j.createdAt) })}
                </span>
                <span className="block text-xs text-muted-foreground">{deadline(j)}</span>
              </span>
              {/* The match, and Save under it */}
              <span className="flex shrink-0 flex-col items-center gap-2">
                {isSeeker && talent && <MatchRing percent={matchPercent(talent, j)} size={36} />}
                {isSeeker && (
                  <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                    <SaveJobButton jobId={j.id} />
                  </span>
                )}
              </span>
            </div>
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
