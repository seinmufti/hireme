"use client"

import { JobForm } from "@/components/jobs/job-form"
import { useT } from "@/i18n/provider"
import { useRoleGuard } from "@/lib/use-role-guard"

export function NewJobView() {
  const viewer = useRoleGuard(["EMPLOYER"])
  const t = useT()
  if (!viewer) return null
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("jobs.postJob")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("jobs.postingFor", { company: viewer.company })}
        </p>
      </div>
      <JobForm />
    </div>
  )
}
