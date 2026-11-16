"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { JobDetail } from "@/components/jobs/job-detail"
import { useT } from "@/i18n/provider"
import { takesApplications } from "@/lib/jobs"
import { useStore } from "@/lib/store"
import { useMyTalent } from "@/lib/use-my-talent"
import { ANYONE } from "@/lib/options"
import { useRoleGuard } from "@/lib/use-role-guard"

export function JobView({ id }: { id: string }) {
  const viewer = useRoleGuard(ANYONE)
  const job = useStore((s) => s.jobs.find((j) => j.id === id)) ?? null
  const talent = useMyTalent()
  const router = useRouter()
  // Job seekers and visitors: an open job opens in the Jobs tab (the list with this job open beside it)
  const toJobsTab = !!viewer && (viewer.role === "SEEKER" || viewer.role === "GUEST") && !!job && takesApplications(job)
  useEffect(() => {
    if (toJobsTab) router.replace(`/jobs?job=${id}`)
  }, [toJobsTab, id, router])
  if (!viewer || toJobsTab) return null
  if (!job) return <JobNotFound href={viewer.role === "EMPLOYER" ? "/jobs/mine" : "/jobs"} />
  return <JobDetail job={job} viewer={viewer} talent={talent} />
}

export function JobNotFound({ href = "/jobs" }: { href?: string }) {
  const t = useT()
  return (
    <div className="mx-auto max-w-md rounded-xl border border-dashed bg-card py-16 text-center">
      <p className="font-medium">{t("jobs.notFound")}</p>
      <Link href={href} className="mt-2 inline-block text-sm text-primary hover:underline">
        {t("jobs.browseAll")}
      </Link>
    </div>
  )
}
