"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeftIcon, BellPlusIcon, BellRingIcon } from "lucide-react"
import { CompanyLogo } from "@/components/company-logo"
import { ActionsPanel } from "@/components/home/actions-panel"
import { CompanyCard } from "@/components/jobs/job-detail"
import { JobListCard } from "@/components/jobs/job-list-card"
import { Button } from "@/components/ui/button"
import { useT } from "@/i18n/provider"
import { takesApplications } from "@/lib/jobs"
import { ANYONE } from "@/lib/options"
import { useStore } from "@/lib/store"
import { useMyTalent } from "@/lib/use-my-talent"
import { useRoleGuard } from "@/lib/use-role-guard"

// One company: on the left who they are (name, Follow, about and contact); on the right the Actions card, then every
// job it has open as a list, like the Jobs tab's (each opens the job).
export function CompanyView({ id }: { id: string }) {
  const viewer = useRoleGuard(ANYONE)
  const t = useT()
  const router = useRouter()
  const company = useStore((s) => s.users.find((u) => u.id === id && u.role === "EMPLOYER")) ?? null
  const allJobs = useStore((s) => s.jobs)
  const talent = useMyTalent()
  const jobs = useMemo(
    () => allJobs.filter((j) => j.employerId === id && takesApplications(j)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [allJobs, id]
  )
  // Job seekers follow a company to hear about every job it posts
  const following = useStore((s) => s.follows.some((f) => f.userId === s.currentUserId && f.employerId === id))
  const toggleFollow = useStore((s) => s.toggleFollow)

  if (!viewer) return null
  const isSeeker = viewer.role === "SEEKER"
  // Back to all companies (recruiters), or to the jobs this company came from
  const back =
    viewer.role === "RECRUITER"
      ? { href: "/companies", label: t("companies.allCompanies") }
      : viewer.role === "EMPLOYER"
        ? { href: "/jobs/mine", label: t("jobs.myPosts") }
        : { href: "/jobs", label: t("jobs.allJobs") }
  if (!company) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-dashed bg-card py-16 text-center">
        <p className="font-medium">{t("companies.notFound")}</p>
        <Link href={back.href} className="mt-2 inline-block text-sm text-primary hover:underline">
          {back.label}
        </Link>
      </div>
    )
  }

  const openJobs = jobs.length ? (jobs.length === 1 ? t("companies.openJobsOne") : t("companies.openJobs", { count: jobs.length })) : t("companies.noOpenJobs")

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link href={back.href} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4 rtl:rotate-180" /> {back.label}
      </Link>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        {/* The company */}
        <section className="min-w-0 space-y-4">
          <div className="flex items-start gap-4">
            <CompanyLogo employer={company} size={56} />
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight">{company.company || company.name}</h1>
              <p className="text-sm text-muted-foreground">{openJobs}</p>
              {/* Follow, under the name */}
              {isSeeker && (
                <Button
                  variant={following ? "outline" : "default"}
                  size="sm"
                  className="mt-2.5"
                  onClick={() => toggleFollow(company.id)}
                  aria-pressed={following}
                >
                  {following ? <BellRingIcon /> : <BellPlusIcon />} {following ? t("companies.following") : t("companies.follow")}
                </Button>
              )}
            </div>
          </div>
          <CompanyCard employer={company} showContact hideName />
        </section>

        {/* The right column: the Actions card on top (job seekers, wide screens), then its open jobs as a list */}
        <div className="min-w-0 space-y-4">
        {isSeeker && (
          <div className="hidden lg:block">
            <ActionsPanel />
          </div>
        )}
        <aside className="no-scrollbar space-y-2 rounded-xl border bg-muted/30 p-3 lg:sticky lg:top-[calc(3.5rem+1.5rem)] lg:max-h-[calc(100dvh-7.5rem)] lg:overflow-y-auto">
          <h2 className="px-1 pt-1 text-xs font-medium text-muted-foreground">{openJobs}</h2>
          {jobs.length === 0 && <p className="rounded-xl border border-dashed bg-card px-4 py-8 text-center text-sm text-muted-foreground">{t("companies.noOpenJobs")}</p>}
          {jobs.map((j) => (
            <JobListCard key={j.id} job={j} onOpen={() => router.push(`/jobs/${j.id}`)} talent={talent} isSeeker={isSeeker} />
          ))}
        </aside>
        </div>
      </div>
    </div>
  )
}
