"use client"

import { JobForm } from "@/components/jobs/job-form"
import { useT } from "@/i18n/provider"
import { useStore } from "@/lib/store"
import { useRoleGuard } from "@/lib/use-role-guard"
import { JobNotFound } from "../view"

// Only the employer who posted a job can edit it
export function EditJobView({ id }: { id: string }) {
  const viewer = useRoleGuard(["EMPLOYER"])
  const t = useT()
  const job = useStore((s) => s.jobs.find((j) => j.id === id && j.employerId === viewer?.id)) ?? null
  if (!viewer) return null
  if (!job) return <JobNotFound />
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("jobs.editTitle")}</h1>
      <JobForm key={job.id} job={job} />
    </div>
  )
}
