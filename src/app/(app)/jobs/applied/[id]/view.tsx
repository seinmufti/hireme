"use client"

import { useState } from "react"
import Link from "next/link"
import { ArchiveIcon, ArrowLeftIcon } from "lucide-react"
import { toast } from "sonner"
import { ApplicationProgress } from "@/components/jobs/application-progress"
import { WithdrawDialog } from "@/components/jobs/applications"
import { JobDetail } from "@/components/jobs/job-detail"
import { useI18n, useT, useTimeAgo } from "@/i18n/provider"
import { seekerStage } from "@/lib/application-stage"
import { useStore } from "@/lib/store"
import { useMyTalent } from "@/lib/use-my-talent"
import { useRoleGuard } from "@/lib/use-role-guard"
import { JobNotFound } from "../../[id]/view"

// One of the job seeker's applications, in the Applications tab: where it stands (the same progress as on the
// list, with the reason or the archive), then the job itself, as on the Jobs tab.
export function ApplicationView({ id }: { id: string }) {
  const viewer = useRoleGuard(["SEEKER"])
  const t = useT()
  const { locale } = useI18n()
  const timeAgo = useTimeAgo()
  const talent = useMyTalent()
  const application = useStore((s) => s.applications.find((a) => a.id === id && a.seekerId === s.currentUserId)) ?? null
  const job = useStore((s) => (application ? s.jobs.find((j) => j.id === application.jobId) : undefined)) ?? null
  const conversations = useStore((s) => s.conversations)
  // Its number: the order they applied in (#1 is the first)
  const number = useStore((s) =>
    application ? s.applications.filter((a) => a.seekerId === application.seekerId && a.createdAt <= application.createdAt).length : 0
  )
  const withdraw = useStore((s) => s.withdrawApplication)
  const [withdrawing, setWithdrawing] = useState(false)
  if (!viewer) return null
  if (!application || !job) return <JobNotFound href="/jobs/applied" />

  const stage = seekerStage(application, job, conversations)
  const thread = conversations.find((c) => c.employerId === job.employerId && c.seekerId === application.seekerId && (!c.jobId || c.jobId === job.id))
  const lang = locale === "en" ? "en-GB" : locale

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/jobs/applied" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4 rtl:rotate-180" /> {t("applications.myTitle")}
      </Link>


      {/* The job, as on the Jobs tab, and under it where the application stands */}
      <JobDetail
        job={job}
        viewer={viewer}
        talent={talent}
        embedded
        below={
          <>
            {/* Where the application stands */}
            <section className="rounded-xl border bg-card p-4 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="text-lg font-semibold">
                  <span className="me-2 text-muted-foreground tabular-nums">#{number}</span>
                  {t("applications.yourApplication")}
                </h2>
                <p className="text-xs text-muted-foreground">{t("applications.appliedAgo", { time: timeAgo(application.createdAt) })}</p>
              </div>
              <ApplicationProgress stage={stage} application={application} thread={thread} />
              {application.note && <p className="mt-4 rounded-lg bg-muted/50 px-3 py-2 text-sm whitespace-pre-line">{application.note}</p>}
              {stage === "rejected" && application.rejectionReason && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
                  <p className="text-xs font-medium">{t("applications.rejectionReason")}</p>
                  <p className="mt-0.5 whitespace-pre-line">{application.rejectionReason}</p>
                </div>
              )}
              {application.withdrawnAt && (
                <p className="mt-3 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <ArchiveIcon className="size-4 shrink-0" />
                  {t("applications.withdrawnOn", {
                    date: new Date(application.withdrawnAt).toLocaleDateString(lang, { day: "numeric", month: "short", year: "numeric" }),
                    time: new Date(application.withdrawnAt).toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" }),
                  })}
                </p>
              )}
              {((!application.withdrawnAt && stage !== "rejected") || thread) && (
                <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  {!application.withdrawnAt && stage !== "rejected" && (
                    <button type="button" className="text-blue-700 underline underline-offset-4 hover:text-blue-800" onClick={() => setWithdrawing(true)}>
                      {t("applications.withdrawShort")}
                    </button>
                  )}
                  {thread && (
                    <Link href={`/inbox/${thread.id}`} className="text-blue-700 underline underline-offset-4 hover:text-blue-800">
                      {t("applications.openConversation")}
                    </Link>
                  )}
                </p>
              )}
            </section>
          </>
        }
      />

      <WithdrawDialog
        job={job}
        open={withdrawing}
        onOpenChange={setWithdrawing}
        onConfirm={() => {
          withdraw(application.id)
          setWithdrawing(false)
          toast.success(t("applications.withdrawn"))
        }}
      />
    </div>
  )
}
