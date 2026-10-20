"use client"

import { JobForm } from "@/components/jobs/job-form"
import { useRoleGuard } from "@/lib/use-role-guard"

export function NewJobView() {
  const viewer = useRoleGuard(["EMPLOYER"])
  if (!viewer) return null
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Post a job</h1>
        <p className="text-sm text-muted-foreground">
          Posting for <span className="font-medium text-foreground">{viewer.company}</span>. Job seekers who match the job are notified right away.
        </p>
      </div>
      <JobForm />
    </div>
  )
}
