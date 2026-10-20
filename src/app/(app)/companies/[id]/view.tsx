"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import { JobCard } from "@/components/jobs/job-card"
import { CompanyCard } from "@/components/jobs/job-detail"
import { useT } from "@/i18n/provider"
import { takesApplications } from "@/lib/jobs"
import { matchingJobs, matchPoints } from "@/lib/matching"
import { useStore } from "@/lib/store"
import { useMyTalent } from "@/lib/use-my-talent"
import { ANYONE } from "@/lib/options"
import { useRoleGuard } from "@/lib/use-role-guard"

// One company: its contact details and the jobs it has open.
export function CompanyView({ id }: { id: string }) {
  const viewer = useRoleGuard(ANYONE)
  const t = useT()
  const company = useStore((s) => s.users.find((u) => u.id === id && u.role === "EMPLOYER")) ?? null
  const allJobs = useStore((s) => s.jobs)
  const talent = useMyTalent()
  const jobs = useMemo(
    () => allJobs.filter((j) => j.employerId === id && takesApplications(j)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [allJobs, id]
  )
  const matched = useMemo(() => new Set(talent ? matchingJobs(talent, jobs).map((m) => m.job.id) : []), [talent, jobs])
  const have = [...(talent?.hardSkills ?? []), ...(talent?.softSkills ?? [])]

  if (!viewer) return null
  if (!company) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-dashed bg-card py-16 text-center">
        <p className="font-medium">{t("companies.notFound")}</p>
        <Link href="/companies" className="mt-2 inline-block text-sm text-primary hover:underline">
          {t("companies.browseAll")}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/companies" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4 rtl:rotate-180" /> {t("companies.allCompanies")}
      </Link>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_20rem]">
        <section className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{company.company || company.name}</h1>
            <p className="text-sm text-muted-foreground">
              {jobs.length ? (jobs.length === 1 ? t("companies.openJobsOne") : t("companies.openJobs", { count: jobs.length })) : t("companies.noOpenJobs")}
            </p>
          </div>
          {jobs.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {jobs.map((j) => (
                <JobCard key={j.id} job={j} matches={talent ? matchPoints(talent, j) : undefined} isMatch={matched.has(j.id)} have={have} />
              ))}
            </div>
          )}
        </section>
        <aside>
          <CompanyCard employer={company} showContact />
        </aside>
      </div>
    </div>
  )
}
