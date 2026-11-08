"use client"

import Link from "next/link"
import { ArrowLeftIcon, BellIcon, LogInIcon, MailIcon, PencilIcon, PhoneIcon, UsersIcon } from "lucide-react"
import { toast } from "sonner"
import { CompanyLink } from "@/components/company-link"
import { CompanyLogo } from "@/components/company-logo"
import { ActionsPanel } from "@/components/home/actions-panel"
import { Button, buttonVariants, EDIT_LINK } from "@/components/ui/button"
import { useMemo } from "react"
import { useLocationLabel, useT } from "@/i18n/provider"
import { takesApplications } from "@/lib/jobs"
import { matchDetails, matchPercent, type MatchableTalent } from "@/lib/matching"
import { MatchRing } from "./match-ring"
import { CheckIcon, XIcon } from "lucide-react"
import { JobPostingData } from "./job-posting-data"
import { SaveJobButton } from "@/components/save-button"
import { useStore } from "@/lib/store"
import type { Job, User } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ApplicantsList, ApplyPanel, QuickApply, useMyApplication } from "./applications"
import { JobDescription, SkillChips, useJobFacts } from "./job-meta"

/** One job: what it is, why it suits the job seeker, and the company behind it. */
export function JobDetail({
  job,
  viewer,
  talent,
  embedded,
  below,
  pane,
}: {
  job: Job
  viewer: User
  talent: MatchableTalent | null
  /** Inside another page (an application's): no way back of its own */
  embedded?: boolean
  /** Shown right under the job (e.g. where the application stands) */
  below?: React.ReactNode
  /** In a pane beside a list (Jobs 2): one column, no way back, no Actions card */
  pane?: boolean
}) {
  const t = useT()
  const jobFacts = useJobFacts()
  const employer = useStore((s) => s.users.find((u) => u.id === job.employerId)) ?? null
  const notified = useStore((s) => s.notifications.filter((n) => n.jobId === job.id).length)
  const applicants = useStore((s) => s.applications.filter((a) => a.jobId === job.id && !a.withdrawnAt).length)
  const setJobOpen = useStore((s) => s.setJobOpen)
  const isOwner = viewer.id === job.employerId
  const isSeeker = viewer.role === "SEEKER"
  const myApplication = useMyApplication(job.id, isSeeker ? viewer.id : "")
  // In a pane (the Jobs tab): "Easy apply" at the top right, until they've applied
  const easyApply = pane && isSeeker && !myApplication && takesApplications(job)
  const have = [...(talent?.hardSkills ?? []), ...(talent?.softSkills ?? [])]

  return (
    <div className={pane ? "space-y-6" : "mx-auto max-w-5xl space-y-6"}>
      {/* For search engines: open jobs only */}
      {takesApplications(job) && <JobPostingData job={job} />}
      {!embedded && !pane && (
        <Link href={isOwner ? "/jobs/mine" : "/jobs"} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon className="size-4 rtl:rotate-180" /> {isOwner ? t("jobs.myPosts") : t("jobs.allJobs")}
        </Link>
      )}

      {!takesApplications(job) && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {isOwner ? t("jobs.closedOwner") : t("jobs.closedSeeker")}
        </div>
      )}

      <div className={cn("grid grid-cols-1 items-start", pane ? "gap-0" : "gap-6 lg:grid-cols-[1fr_20rem]")}>
        <div className="min-w-0 space-y-6">
        <article className={cn("space-y-6 p-6", !pane && "rounded-xl border bg-card")}>
          <header className="space-y-3">
            <div className="flex flex-wrap items-start gap-4">
              <Link href={`/companies/${job.employerId}`} className="shrink-0" aria-label={job.company}>
                <CompanyLogo employerId={job.employerId} name={job.company} size={56} />
              </Link>
              <div className="min-w-40 flex-1">
                <h1 className="text-2xl font-semibold tracking-tight">{job.title}</h1>
                <Link href={`/companies/${job.employerId}`} className="text-muted-foreground hover:text-foreground hover:underline">
                  {job.company}
                </Link>
              </div>
              {easyApply && <QuickApply job={job} className="h-9 shrink-0 px-4" />}
            </div>
            <dl className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
              {jobFacts(job)
                .filter((f) => f.key !== "company")
                .map((f) => (
                  <div key={f.key} className="flex items-center gap-1.5" title={f.hint}>
                    <f.icon className="size-4 shrink-0" />
                    <dt className="sr-only">{f.label}</dt>
                    <dd>{f.value}</dd>
                  </div>
                ))}
            </dl>
          </header>

          {job.skills.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">{t("jobs.skills")}</h2>
              <SkillChips skills={job.skills} have={have} />
            </section>
          )}

          {(job.languages?.length ?? 0) > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">{t("jobs.languages")}</h2>
              <SkillChips skills={job.languages ?? []} have={(talent?.languages ?? []).map((l) => l.language)} />
            </section>
          )}

          <section>
            <h2 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">{t("jobs.about")}</h2>
            <JobDescription text={job.description} />
          </section>
        </article>
        {below}
        </div>

        {/* The employer's own job on phones: Edit, Close and the applicant count first, above the description */}
        <aside className={cn("space-y-4", isOwner && "order-first lg:order-none", pane && "px-6 pb-6")}>
          {isOwner ? (
            <div className="space-y-3 rounded-xl border bg-card p-5">
              <p className="flex items-center gap-2 text-sm">
                <BellIcon className="size-4 text-muted-foreground" />
                {notified === 1 ? t("jobs.notifiedOne") : t("jobs.notified", { count: notified })}
              </p>
              <a href="#applicants" className="flex items-center gap-2 text-sm hover:underline">
                <UsersIcon className="size-4 text-muted-foreground" />
                {applicants === 1 ? t("jobs.applicantsOne") : t("jobs.applicants", { count: applicants })}
              </a>
              <div className="flex gap-2">
                <Link href={`/jobs/${job.id}/edit`} className={cn(buttonVariants({ variant: "ghost" }), EDIT_LINK, "flex-1")}>
                  <PencilIcon /> {t("common.edit")}
                </Link>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setJobOpen(job.id, !job.open)
                    toast.success(job.open ? t("jobs.jobClosed") : t("jobs.jobReopened"))
                  }}
                >
                  {job.open ? t("jobs.closeJob") : t("jobs.reopenJob")}
                </Button>
              </div>
            </div>
          ) : easyApply ? null : (
            <div className="space-y-3 rounded-xl border bg-card p-5">
              {isSeeker && <ApplyPanel job={job} viewer={viewer} />}
              {viewer.role === "GUEST" && takesApplications(job) && (
                <Link href="/login" className={buttonVariants({ className: "w-full" })}>
                  <LogInIcon /> {t("applications.signInToApply")}
                </Link>
              )}
            </div>
          )}

          {/* Job seekers: how much of the job their profile matches */}
          {isSeeker && talent && !pane && <ProfileMatch job={job} talent={talent} />}

          {/* The employer's own job: their company card (not on phones); everyone else: other jobs like this one */}
          {isOwner
            ? employer && (
                <div className="hidden lg:block">
                  <CompanyCard employer={employer} />
                </div>
              )
            : !pane && <RelatedJobs basis={[job]} talent={isSeeker ? talent : null} />}
          {/* Job seekers, wide screens: the Actions card, as on the other tabs */}
          {isSeeker && !pane && (
            <div className="hidden lg:block">
              <ActionsPanel />
            </div>
          )}
        </aside>
      </div>

      {isOwner && <ApplicantsList job={job} viewer={viewer} />}

      {!isOwner && !pane && <MobileApplyBar job={job} viewer={viewer} />}
    </div>
  )
}

/**
 * Phones: Apply (and Save) stay pinned above the tab bar while reading the job, as on Indeed or LinkedIn,
 * instead of waiting at the bottom of the page. Gone once applied; the status is in the panel below.
 */
function MobileApplyBar({ job, viewer }: { job: Job; viewer: User }) {
  const t = useT()
  const applied = useMyApplication(job.id, viewer.id)
  const isSeeker = viewer.role === "SEEKER"
  if (!takesApplications(job) || applied || (!isSeeker && viewer.role !== "GUEST")) return null
  return (
    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
      <div className="flex items-start gap-2">
        {isSeeker ? (
          <>
            <SaveJobButton jobId={job.id} className="size-10 shrink-0 rounded-lg border" />
            <div className="min-w-0 flex-1 [&_button]:h-10">
              <ApplyPanel job={job} viewer={viewer} />
            </div>
          </>
        ) : (
          <Link href="/login" className={buttonVariants({ className: "h-10 w-full" })}>
            <LogInIcon /> {t("applications.signInToApply")}
          </Link>
        )}
      </div>
    </div>
  )
}

/** The company behind a job, with its contact details. */
/**
 * Other open jobs like this one: the same field, or at least two skills in common; the most alike first (the same
 * city counts a little), at most 5.
 */
export function RelatedJobs({ basis, talent, exclude }: { basis: Job[]; talent: MatchableTalent | null; exclude?: string[] }) {
  const t = useT()
  const locationLabel = useLocationLabel()
  const all = useStore((s) => s.jobs)
  const related = useMemo(() => {
    const skip = new Set([...basis.map((b) => b.id), ...(exclude ?? [])])
    // How alike a job is to one of the basis jobs; the best of them counts
    const likeness = (j: Job, job: Job) => {
      const skills = new Set(job.skills.map((s) => s.toLowerCase()))
      const shared = j.skills.filter((s) => skills.has(s.toLowerCase())).length
      const sameField = j.category === job.category
      if (!sameField && shared < 2) return -1
      return (sameField ? 10 : 0) + shared * 2 + (j.location.iraqCity && j.location.iraqCity === job.location.iraqCity ? 1 : 0)
    }
    return all
      .filter((j) => !skip.has(j.id) && takesApplications(j))
      .map((j) => ({ job: j, score: Math.max(-1, ...basis.map((b) => likeness(j, b))) }))
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score || b.job.createdAt.localeCompare(a.job.createdAt))
      .slice(0, 5)
      .map((x) => x.job)
  }, [all, basis, exclude])
  if (related.length === 0) return null
  return (
    <section className="rounded-xl border bg-card p-5 text-sm">
      <h2 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("jobs.relatedJobs")}</h2>
      <ul className="space-y-3">
        {related.map((j) => (
          <li key={j.id} className="flex items-center gap-3">
            <CompanyLink employerId={j.employerId} label={j.company} className="shrink-0">
              <CompanyLogo employerId={j.employerId} name={j.company} size={36} />
            </CompanyLink>
            <div className="min-w-0">
              <Link href={`/jobs/${j.id}`} className="block truncate font-medium hover:underline">
                {j.title}
              </Link>
              <p className="truncate text-xs text-muted-foreground"><CompanyLink employerId={j.employerId}>{j.company}</CompanyLink>
                {locationLabel(j.location) && ` · ${locationLabel(j.location)}`}
              </p>
            </div>
            {talent && <MatchRing percent={matchPercent(talent, j)} size={40} className="ms-auto" />}
          </li>
        ))}
      </ul>
    </section>
  )
}

/** How much of the job the job seeker's profile matches: the ring, then what matches and what doesn't. */
function ProfileMatch({ job, talent }: { job: Job; talent: MatchableTalent }) {
  const t = useT()
  const { skills, category, title, languages } = matchDetails(talent, job)
  const percent = matchPercent(talent, job)
  const rows = [
    { ok: skills.length > 0, label: t("jobs.matchSkills", { have: skills.length, total: job.skills.length }) },
    { ok: category, label: t("jobs.matchField") },
    { ok: title, label: t("jobs.matchTitle") },
    ...(job.languages?.length
      ? [{ ok: languages.length > 0, label: t("jobs.matchLanguages", { have: languages.length, total: job.languages.length }) }]
      : []),
  ]
  return (
    <section className="rounded-xl border bg-card p-5 text-sm">
      <h2 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("jobs.profileMatch")}</h2>
      <div className="flex items-center gap-4">
        <MatchRing percent={percent} size={72} />
        <ul className="min-w-0 space-y-1.5">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center gap-1.5">
              {r.ok ? <CheckIcon className="size-4 shrink-0 text-emerald-600" /> : <XIcon className="size-4 shrink-0 text-muted-foreground" />}
              <span className={r.ok ? "" : "text-muted-foreground"}>{r.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** The company; its contact details only on the company's own page (`showContact`), not on job pages. */
export function CompanyCard({ employer, showContact }: { employer: User; showContact?: boolean }) {
  const t = useT()
  return (
    <div className="space-y-3 rounded-xl border bg-card p-5 text-sm">
      <div className="flex items-center gap-3">
        <CompanyLogo employer={employer} size={40} />
        <div className="min-w-0">
          <Link href={`/companies/${employer.id}`} className="block truncate font-medium hover:underline">
            {employer.company || employer.name}
          </Link>
          {employer.city && <p className="truncate text-xs text-muted-foreground">{employer.city}</p>}
        </div>
      </div>
      {employer.bio && <p className="text-muted-foreground">{employer.bio}</p>}
      {showContact && (
        <dl className="space-y-1.5">
          <div className="text-xs text-muted-foreground">
            {employer.name}
            {employer.title && ` · ${employer.title}`}
          </div>
          {employer.email && (
            <div className="flex items-center gap-2">
              <MailIcon className="size-3.5 shrink-0 text-muted-foreground" />
              <dt className="sr-only">{t("companies.email")}</dt>
              <dd className="truncate">
                <a href={`mailto:${employer.email}`} className="hover:underline">{employer.email}</a>
              </dd>
            </div>
          )}
          {employer.phone && (
            <div className="flex items-center gap-2">
              <PhoneIcon className="size-3.5 shrink-0 text-muted-foreground" />
              <dt className="sr-only">{t("companies.phone")}</dt>
              <dd>
                <a href={`tel:${employer.phone.replace(/\s/g, "")}`} className="hover:underline">{employer.phone}</a>
              </dd>
            </div>
          )}
        </dl>
      )}
    </div>
  )
}
