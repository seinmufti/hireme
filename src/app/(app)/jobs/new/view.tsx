"use client"

import { useSearchParams } from "next/navigation"
import { JobForm } from "@/components/jobs/job-form"
import { useStore } from "@/lib/store"
import { useT } from "@/i18n/provider"
import { useRoleGuard } from "@/lib/use-role-guard"

export function NewJobView() {
  const viewer = useRoleGuard(["EMPLOYER"])
  const t = useT()
  // "Duplicate" on My job posts: /jobs/new?from=<job id>, one of this employer's own jobs
  const fromId = useSearchParams().get("from")
  const from = useStore((s) => s.jobs.find((j) => j.id === fromId && j.employerId === s.currentUserId))
  if (!viewer) return null
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("jobs.postJob")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("jobs.postingFor", { company: viewer.company })}
        </p>
      </div>
      <JobForm key={from?.id ?? "new"} from={from} />
    </div>
  )
}
