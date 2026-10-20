"use client"

import Link from "next/link"
import { ArrowLeftIcon, BellIcon, MailIcon, PencilIcon, PhoneIcon, SparklesIcon, UsersIcon } from "lucide-react"
import { toast } from "sonner"
import { UserAvatar } from "@/components/user-avatar"
import { Button, buttonVariants } from "@/components/ui/button"
import { useT } from "@/i18n/provider"
import { matchJob, type MatchableTalent } from "@/lib/matching"
import { useStore } from "@/lib/store"
import type { Job, User } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ApplicantsList, ApplyPanel } from "./applications"
import { JobDescription, SkillChips, useJobFacts } from "./job-meta"

/** One job: what it is, why it suits the job seeker, and the company behind it. */
export function JobDetail({ job, viewer, talent }: { job: Job; viewer: User; talent: MatchableTalent | null }) {
  const t = useT()
  const jobFacts = useJobFacts()
  const employer = useStore((s) => s.users.find((u) => u.id === job.employerId)) ?? null
  const notified = useStore((s) => s.notifications.filter((n) => n.jobId === job.id).length)
  const applicants = useStore((s) => s.applications.filter((a) => a.jobId === job.id).length)
  const setJobOpen = useStore((s) => s.setJobOpen)
  const isOwner = viewer.id === job.employerId
  const isSeeker = viewer.role === "SEEKER"
  // Matching ignores closed jobs, so check the job as if it were open
  const match = isSeeker && talent ? matchJob(talent, { ...job, open: true }) : null
  const have = [...(talent?.hardSkills ?? []), ...(talent?.softSkills ?? [])]

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href={isOwner ? "/jobs/mine" : "/jobs"} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4 rtl:rotate-180" /> {isOwner ? t("jobs.myPosts") : t("jobs.allJobs")}
      </Link>

      {!job.open && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {isOwner ? t("jobs.closedOwner") : t("jobs.closedSeeker")}
        </div>
      )}

      <div className="grid grid-cols-[1fr_20rem] items-start gap-6">
        <article className="space-y-6 rounded-xl border bg-card p-6">
          <header className="space-y-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{job.title}</h1>
              <Link href={`/companies/${job.employerId}`} className="text-muted-foreground hover:text-foreground hover:underline">
                {job.company}
              </Link>
            </div>
            <dl className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
              {jobFacts(job)
                .filter((f) => f.key !== "company")
                .map((f) => (
                  <div key={f.key} className="flex items-center gap-1.5">
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

          <section>
            <h2 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">{t("jobs.about")}</h2>
            <JobDescription text={job.description} />
          </section>
        </article>

        <aside className="space-y-4">
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
                <Link href={`/jobs/${job.id}/edit`} className={cn(buttonVariants({ variant: "outline" }), "flex-1")}>
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
          ) : (
            <div className="space-y-3 rounded-xl border bg-card p-5">
              {isSeeker && (
                <div
                  className={cn(
                    "rounded-lg border p-3 text-sm",
                    match ? "border-emerald-300 bg-emerald-50 text-emerald-950" : "bg-muted/40 text-muted-foreground"
                  )}
                >
                  <p className="mb-1 flex items-center gap-1.5 font-medium">
                    <SparklesIcon className="size-4" /> {match ? t("jobs.isMatch") : t("jobs.notMatch")}
                  </p>
                  {match ? (
                    <ul className="list-disc space-y-0.5 ps-5 text-xs">
                      {match.category && <li>{t("jobs.reasonCategory", { category: job.category })}</li>}
                      {match.skills.length > 0 && <li>{t("jobs.reasonSkills", { skills: match.skills.join(", ") })}</li>}
                      {match.title && <li>{t("jobs.reasonTitle")}</li>}
                    </ul>
                  ) : (
                    <p className="text-xs">
                      {t("jobs.notMatchHint")}{" "}
                      <Link href="/profile" className="underline">{t("jobs.editProfile")}</Link>
                    </p>
                  )}
                </div>
              )}
              {isSeeker && <ApplyPanel job={job} viewer={viewer} />}
            </div>
          )}

          {employer && <CompanyCard employer={employer} />}
        </aside>
      </div>

      {isOwner && <ApplicantsList job={job} viewer={viewer} />}
    </div>
  )
}

/** The company behind a job, with its contact details. */
export function CompanyCard({ employer }: { employer: User }) {
  const t = useT()
  return (
    <div className="space-y-3 rounded-xl border bg-card p-5 text-sm">
      <div className="flex items-center gap-3">
        <UserAvatar name={employer.company || employer.name} color={employer.avatarColor} size={40} />
        <div className="min-w-0">
          <Link href={`/companies/${employer.id}`} className="block truncate font-medium hover:underline">
            {employer.company || employer.name}
          </Link>
          {employer.city && <p className="truncate text-xs text-muted-foreground">{employer.city}</p>}
        </div>
      </div>
      {employer.bio && <p className="text-muted-foreground">{employer.bio}</p>}
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
    </div>
  )
}
