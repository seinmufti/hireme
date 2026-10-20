"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { WorkPreferenceCard } from "@/components/home/work-preference"
import { JobBrowser } from "@/components/jobs/job-browser"
import { useStore } from "@/lib/store"
import { useMyTalent } from "@/lib/use-my-talent"
import { useRoleGuard } from "@/lib/use-role-guard"

// Job seekers and recruiters search jobs; job seekers also see which ones match them, and set the work they want.
// Employers don't search jobs: they're sent to their own posts.
export function JobsView({ initialQuery }: { initialQuery: string }) {
  const viewer = useRoleGuard()
  const jobs = useStore((s) => s.jobs)
  const talent = useMyTalent()
  const router = useRouter()
  const isEmployer = viewer?.role === "EMPLOYER"
  useEffect(() => {
    if (isEmployer) router.replace("/jobs/mine")
  }, [isEmployer, router])
  if (!viewer || isEmployer) return null
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
