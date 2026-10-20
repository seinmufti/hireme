"use client"

import Link from "next/link"
import { JobDetail } from "@/components/jobs/job-detail"
import { useStore } from "@/lib/store"
import { useMyTalent } from "@/lib/use-my-talent"
import { useRoleGuard } from "@/lib/use-role-guard"

export function JobView({ id }: { id: string }) {
  const viewer = useRoleGuard()
  const job = useStore((s) => s.jobs.find((j) => j.id === id)) ?? null
  const talent = useMyTalent()
  if (!viewer) return null
  if (!job) return <JobNotFound />
  return <JobDetail job={job} viewer={viewer} talent={talent} />
}

export function JobNotFound() {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-dashed bg-card py-16 text-center">
      <p className="font-medium">This job doesn&apos;t exist</p>
      <Link href="/jobs" className="mt-2 inline-block text-sm text-primary hover:underline">
        Browse all jobs
      </Link>
    </div>
  )
}
