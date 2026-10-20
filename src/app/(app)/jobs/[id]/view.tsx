"use client"

import Link from "next/link"
import { JobDetail } from "@/components/jobs/job-detail"
import { useT } from "@/i18n/provider"
import { useStore } from "@/lib/store"
import { useMyTalent } from "@/lib/use-my-talent"
import { useRoleGuard } from "@/lib/use-role-guard"

export function JobView({ id }: { id: string }) {
  const viewer = useRoleGuard()
  const job = useStore((s) => s.jobs.find((j) => j.id === id)) ?? null
  const talent = useMyTalent()
  if (!viewer) return null
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
