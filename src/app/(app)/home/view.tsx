"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ArrowRightIcon, TargetIcon } from "lucide-react"
import { JobCard } from "@/components/jobs/job-card"
import { buttonVariants } from "@/components/ui/button"
import { useT } from "@/i18n/provider"
import { matchCount, matchingJobs } from "@/lib/matching"
import { useStore } from "@/lib/store"
import { useMyTalent } from "@/lib/use-my-talent"
import { useRoleGuard } from "@/lib/use-role-guard"

// How many matching jobs Home shows; the rest are on the Jobs tab
const SHOWN = 6

// A job seeker's Home: a dashboard, starting with the jobs that match their CV. More panels come later.
export function HomeView() {
  const t = useT()
  const user = useRoleGuard(["SEEKER"])
  const talent = useMyTalent()
  const jobs = useStore((s) => s.jobs)
  const applications = useStore((s) => s.applications)
  const matches = useMemo(() => (talent ? matchingJobs(talent, jobs) : []), [talent, jobs])
  const applied = useMemo(
    () => new Map(applications.filter((a) => a.seekerId === user?.id).map((a) => [a.jobId, a.status])),
    [applications, user?.id]
  )
  if (!user) return null

  const have = [...(talent?.hardSkills ?? []), ...(talent?.softSkills ?? [])]

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{t("home.matchingJobs")}</h1>
            {matches.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {matches.length === 1 ? t("home.matchingOne") : t("home.matchingCount", { count: matches.length })}
              </p>
            )}
          </div>
          {matches.length > SHOWN && (
            <Link href="/jobs" className={buttonVariants({ variant: "outline", size: "sm" })}>
              {t("home.seeAll")} <ArrowRightIcon className="rtl:rotate-180" />
            </Link>
          )}
        </div>
        {matches.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border bg-card px-6 py-10 text-center text-muted-foreground">
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
    </div>
  )
}
