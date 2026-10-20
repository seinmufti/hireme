"use client"

import { WorkPreferenceCard } from "@/components/home/work-preference"
import { JobBrowser } from "@/components/jobs/job-browser"
import { useStore } from "@/lib/store"
import { useMyTalent } from "@/lib/use-my-talent"
import { useRoleGuard } from "@/lib/use-role-guard"

// Every signed-in account can search jobs; job seekers also see which ones match them, and set the work they want.
export function JobsView({ initialQuery }: { initialQuery: string }) {
  const viewer = useRoleGuard()
  const jobs = useStore((s) => s.jobs)
  const talent = useMyTalent()
  if (!viewer) return null
  return (
    <JobBrowser
      key={viewer.id}
      jobs={jobs}
      role={viewer.role}
      talent={talent}
      initialQuery={initialQuery}
      aside={viewer.role === "SEEKER" ? <WorkPreferenceCard user={viewer} talent={talent} /> : undefined}
    />
  )
}
