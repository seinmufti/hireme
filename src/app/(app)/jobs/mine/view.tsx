"use client"

import { useMemo } from "react"
import Link from "next/link"
import { BellIcon, PencilIcon, PlusIcon } from "lucide-react"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import { timeAgo } from "@/lib/format"
import { locationLabel } from "@/lib/jobs"
import { useStore } from "@/lib/store"
import { useRoleGuard } from "@/lib/use-role-guard"
import { cn } from "@/lib/utils"

// An employer's own job posts: open ones first, then closed ones, newest first.
export function MyJobsView() {
  const viewer = useRoleGuard(["EMPLOYER"])
  const allJobs = useStore((s) => s.jobs)
  const notifications = useStore((s) => s.notifications)
  const setJobOpen = useStore((s) => s.setJobOpen)
  const jobs = useMemo(
    () =>
      allJobs
        .filter((j) => j.employerId === viewer?.id)
        .sort((a, b) => Number(b.open) - Number(a.open) || b.createdAt.localeCompare(a.createdAt)),
    [allJobs, viewer]
  )
  if (!viewer) return null

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My job posts</h1>
          <p className="text-sm text-muted-foreground">
            {jobs.filter((j) => j.open).length} open · {jobs.filter((j) => !j.open).length} closed
          </p>
        </div>
        <Link href="/jobs/new" className={buttonVariants()}>
          <PlusIcon /> Post a job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card py-16 text-center">
          <p className="font-medium">You haven&apos;t posted any jobs yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Post one and matching job seekers are notified right away.</p>
        </div>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {jobs.map((j) => {
            const notified = notifications.filter((n) => n.jobId === j.id).length
            return (
              <li key={j.id} className={cn("flex items-center gap-4 px-5 py-4", !j.open && "bg-muted/30")}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/jobs/${j.id}`} className="truncate font-medium hover:underline">
                      {j.title}
                    </Link>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        j.open ? "bg-emerald-50 text-emerald-900" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {j.open ? "Open" : "Closed"}
                    </span>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {[j.category, locationLabel(j.location), j.contractType, `posted ${timeAgo(j.createdAt)}`].join(" · ")}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground" title="Matching job seekers notified">
                  <BellIcon className="size-3.5" /> {notified} notified
                </span>
                <Link href={`/jobs/${j.id}/edit`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                  <PencilIcon /> Edit
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-20"
                  onClick={() => {
                    setJobOpen(j.id, !j.open)
                    toast.success(j.open ? "Job closed" : "Job reopened")
                  }}
                >
                  {j.open ? "Close" : "Reopen"}
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
