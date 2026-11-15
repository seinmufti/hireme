"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ArrowRightIcon, TargetIcon } from "lucide-react"
import { AboutUs, CompaniesCarousel } from "@/components/home/home-sections"
import { HomeSearch } from "@/components/home/home-search"
import { JobCard } from "@/components/jobs/job-card"
import { NotificationList } from "@/components/notifications/notification-list"
import { buttonVariants } from "@/components/ui/button"
import { useT } from "@/i18n/provider"
import { takesApplications } from "@/lib/jobs"
import { matchCount, matchingJobs, matchPoints } from "@/lib/matching"
import { useStore } from "@/lib/store"
import { useMyTalent } from "@/lib/use-my-talent"
import { useRoleGuard } from "@/lib/use-role-guard"

// How many jobs each list on Home shows; the rest are on the Jobs tab
const SHOWN = 6

// A job seeker's Home: the heading and search, the jobs that match their CV, the newest
// jobs, their notifications, the companies hiring here and who we are.
export function HomeView() {
  const t = useT()
  const user = useRoleGuard(["SEEKER"])
  const talent = useMyTalent()
  const jobs = useStore((s) => s.jobs)
  const applications = useStore((s) => s.applications)
  const matches = useMemo(() => (talent ? matchingJobs(talent, jobs) : []), [talent, jobs])
  // The newest open jobs that aren't already in the matches above
  const latest = useMemo(() => {
    const shown = new Set(matches.slice(0, SHOWN).map((m) => m.job.id))
    return jobs
      .filter((j) => takesApplications(j) && !shown.has(j.id))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, SHOWN)
  }, [jobs, matches])
  const applied = useMemo(
    () => new Map(applications.filter((a) => a.seekerId === user?.id && !a.withdrawnAt).map((a) => [a.jobId, a.status])),
    [applications, user?.id]
  )
  if (!user) return null

  const have = [...(talent?.hardSkills ?? []), ...(talent?.softSkills ?? [])]
  const seeAll = (
    <Link href="/jobs" className={buttonVariants({ variant: "outline", size: "sm" })}>
      {t("home.seeAll")} <ArrowRightIcon className="rtl:rotate-180" />
    </Link>
  )

  return (
    <div className="space-y-8">
      {/* The heading, the tagline and a search by where and which contract (opens Jobs) */}
      <section className="rounded-2xl border bg-card px-5 py-7 sm:px-8 sm:py-10">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("home.matchingJobs")}</h1>
            <p className="text-muted-foreground">{t("home.tagline")}</p>
          </div>
          <div className="max-w-3xl">
            <HomeSearch />
          </div>
        </div>
      </section>

      {/* The jobs that match their CV */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{t("home.matchesTitle")}</h2>
            {matches.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {matches.length === 1 ? t("home.matchingOne") : t("home.matchingCount", { count: matches.length })}
              </p>
            )}
          </div>
          {matches.length > SHOWN && seeAll}
        </div>
        {matches.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border bg-card px-6 py-8 text-center text-muted-foreground">
            <TargetIcon className="size-6" />
            <p className="max-w-md text-sm">{t("home.noJobs")}</p>
            <Link href="/overview" className={buttonVariants({ size: "sm" })}>
              {t("jobs.editProfile")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {matches.slice(0, SHOWN).map((m) => (
              <JobCard key={m.job.id} job={m.job} matches={matchCount(m)} isMatch have={have} applied={applied.get(m.job.id)} canApply canSave />
            ))}
          </div>
        )}
      </section>

      {/* The newest jobs, above the notifications */}
      {latest.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-lg font-semibold tracking-tight">{t("home.latestTitle")}</h2>
            {seeAll}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {latest.map((j) => (
              <JobCard key={j.id} job={j} matches={talent ? matchPoints(talent, j) : undefined} have={have} applied={applied.get(j.id)} canApply canSave />
            ))}
          </div>
        </section>
      )}

      {/* New jobs that match the job seeker (the same list as the bell in the header) */}
      <section className="overflow-hidden rounded-xl border bg-card">
        <NotificationList section className="max-h-[32rem]" />
      </section>

      {/* The companies hiring here, moving along */}
      <CompaniesCarousel />

      {/* Who we are */}
      <AboutUs />
    </div>
  )
}
