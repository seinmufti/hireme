"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"
import { AboutUs, CompaniesCarousel, ContactUs } from "@/components/home/home-sections"
import { HomeSearch } from "@/components/home/home-search"
import { JobCard } from "@/components/jobs/job-card"
import { buttonVariants } from "@/components/ui/button"
import { useT } from "@/i18n/provider"
import { takesApplications } from "@/lib/jobs"
import { matchPercent } from "@/lib/matching"
import { useStore } from "@/lib/store"
import { useMyTalent } from "@/lib/use-my-talent"
import { useRoleGuard } from "@/lib/use-role-guard"

// How many of the newest jobs Home shows; the rest are on the Jobs tab
const SHOWN = 6

// A job seeker's Home: the heading and search, the newest jobs, our partners (the companies hiring here) and who we are.
export function HomeView() {
  const t = useT()
  const user = useRoleGuard(["SEEKER"])
  const talent = useMyTalent()
  const jobs = useStore((s) => s.jobs)
  const applications = useStore((s) => s.applications)
  // The newest open jobs
  const latest = useMemo(
    () =>
      jobs
        .filter(takesApplications)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, SHOWN),
    [jobs]
  )
  const applied = useMemo(
    () => new Map(applications.filter((a) => a.seekerId === user?.id && !a.withdrawnAt).map((a) => [a.jobId, a.status])),
    [applications, user?.id]
  )
  if (!user) return null

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
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("nav.jobs")}</h1>
            <p className="text-muted-foreground">{t("home.tagline")}</p>
          </div>
          <div className="max-w-4xl">
            <HomeSearch />
          </div>
        </div>
      </section>

      {/* The newest jobs */}
      {latest.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-lg font-semibold tracking-tight">{t("home.latestTitle")}</h2>
            {seeAll}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {latest.map((j) => (
              <JobCard key={j.id} job={j} percent={talent ? matchPercent(talent, j) : undefined} applied={applied.get(j.id)} canApply canSave />
            ))}
          </div>
        </section>
      )}

      {/* The companies hiring here, moving along */}
      <CompaniesCarousel />

      {/* Who we are */}
      <AboutUs />

      {/* Our social pages */}
      <ContactUs />
    </div>
  )
}
