"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import { toast } from "sonner"
import { ApplicationStatus } from "@/components/jobs/applications"
import { Button, buttonVariants } from "@/components/ui/button"
import { timeAgo } from "@/lib/format"
import { locationLabel } from "@/lib/jobs"
import { useStore } from "@/lib/store"
import { useRoleGuard } from "@/lib/use-role-guard"
import { cn } from "@/lib/utils"

// A job seeker's applications, newest first, with where each one stands.
export function MyApplicationsView() {
  const viewer = useRoleGuard(["SEEKER"])
  const all = useStore((s) => s.applications)
  const jobs = useStore((s) => s.jobs)
  const withdraw = useStore((s) => s.withdrawApplication)
  const applications = useMemo(
    () =>
      all
        .filter((a) => a.seekerId === viewer?.id)
        .flatMap((a) => {
          const job = jobs.find((j) => j.id === a.jobId)
          return job ? [{ application: a, job }] : []
        })
        .sort((a, b) => b.application.createdAt.localeCompare(a.application.createdAt)),
    [all, jobs, viewer]
  )
  if (!viewer) return null

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" /> All jobs
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My applications</h1>
        <p className="text-sm text-muted-foreground">
          {applications.length} application{applications.length === 1 ? "" : "s"}
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card py-16 text-center">
          <p className="font-medium">You haven&apos;t applied to any jobs yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Find a job you like and press Apply. The employer sees your CV.</p>
          <Link href="/jobs" className={cn(buttonVariants(), "mt-4")}>
            Find jobs
          </Link>
        </div>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {applications.map(({ application, job }) => (
            <li key={application.id} className="flex items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <Link href={`/jobs/${job.id}`} className="truncate font-medium hover:underline">
                  {job.title}
                </Link>
                <p className="truncate text-sm text-muted-foreground">
                  {[job.company, locationLabel(job.location), `applied ${timeAgo(application.createdAt)}`, !job.open && "job closed"]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <ApplicationStatus status={application.status} />
              {application.status === "Applied" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => {
                    withdraw(application.id)
                    toast.success("Application withdrawn")
                  }}
                >
                  Withdraw
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
