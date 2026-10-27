"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArchiveIcon, ChevronDownIcon, SearchIcon } from "lucide-react"
import { toast } from "sonner"
import { ApplicationProgress } from "@/components/jobs/application-progress"
import { WithdrawDialog } from "@/components/jobs/applications"
import { Button, buttonVariants } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useI18n, useLocationLabel, useT, useTimeAgo } from "@/i18n/provider"
import { SEEKER_STAGES, seekerStage, type SeekerStage } from "@/lib/application-stage"
import { takesApplications } from "@/lib/jobs"
import { useStore } from "@/lib/store"
import { useRoleGuard } from "@/lib/use-role-guard"
import { cn } from "@/lib/utils"

// A job seeker's applications: how many are at each stage (a tile per stage, which also filters the list),
// then each application with its progress, like tracking a parcel. The stage follows what the employer does
// (see seekerStage).
export function MyApplicationsView() {
  const viewer = useRoleGuard(["SEEKER"])
  const t = useT()
  const { locale } = useI18n()
  const timeAgo = useTimeAgo()
  const locationLabel = useLocationLabel()
  const all = useStore((s) => s.applications)
  const jobs = useStore((s) => s.jobs)
  const conversations = useStore((s) => s.conversations)
  const withdraw = useStore((s) => s.withdrawApplication)
  // The tile picked (null: all of them)
  const [only, setOnly] = useState<SeekerStage | null>(null)
  // Finding a job among them: its title, company or city
  const [query, setQuery] = useState("")
  // The application being withdrawn, waiting for a second click to confirm
  const [withdrawing, setWithdrawing] = useState<string | null>(null)
  // The withdrawn application they're asking to come back to, and their message
  const [askingBack, setAskingBack] = useState<string | null>(null)
  const [backMessage, setBackMessage] = useState("")
  const requestReinstate = useStore((s) => s.requestReinstate)
  const mine = useMemo(
    () =>
      all
        .filter((a) => a.seekerId === viewer?.id)
        .flatMap((a) => {
          const job = jobs.find((j) => j.id === a.jobId)
          if (!job) return []
          // Their conversation with the employer about it, if there is one
          const thread = conversations.find((c) => c.employerId === job.employerId && c.seekerId === a.seekerId && (!c.jobId || c.jobId === job.id))
          return [{ application: a, job, stage: seekerStage(a, job, conversations), thread }]
        })
        .sort((a, b) => b.application.createdAt.localeCompare(a.application.createdAt)),
    [all, jobs, conversations, viewer]
  )
  // Withdrawn ones go to the archive
  const applications = mine.filter((x) => !x.application.withdrawnAt)
  const archived = mine.filter((x) => x.application.withdrawnAt)
  const [archiveOpen, setArchiveOpen] = useState(false)
  if (!viewer) return null
  const words = query.trim().toLowerCase().split(/s+/).filter(Boolean)
  const shown = applications.filter(({ stage, job }) => {
    if (only && stage !== only) return false
    const text = `${job.title} ${job.company} ${locationLabel(job.location)}`.toLowerCase()
    return words.every((w) => text.includes(w))
  })

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{t("applications.myTitle")}</h1>
        {/* Show one stage: only the stages their applications are at (the tiles below do the same) */}
        {applications.length > 0 && (
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
            <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("applications.searchPlaceholder")}
              aria-label={t("applications.searchPlaceholder")}
              className="h-9 ps-9"
            />
          </div>
          <Select value={only ?? "all"} onValueChange={(v) => setOnly(!v || v === "all" ? null : (v as SeekerStage))}>
            <SelectTrigger className="h-9 w-48" aria-label={t("applications.filter")}>
              <SelectValue>
                {(v: string) => (v === "all" ? `${t("applications.allStages")} (${applications.length})` : `${t(`applications.stages.${v as SeekerStage}`)} (${applications.filter((x) => x.stage === v).length})`)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("applications.allStages")} ({applications.length})</SelectItem>
              {SEEKER_STAGES.filter((stage) => applications.some((x) => x.stage === stage)).map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {t(`applications.stages.${stage}`)} ({applications.filter((x) => x.stage === stage).length})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
        )}
      </div>

      {mine.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card py-16 text-center">
          <p className="font-medium">{t("applications.none")}</p>
          <Link href="/jobs" className={cn(buttonVariants(), "mt-4")}>
            {t("applications.findJobs")}
          </Link>
        </div>
      ) : (
        <>
          {/* The summary: in all, then at each stage. A tile shows just those below; picking it again shows all */}
          <div className="grid grid-cols-4 gap-2 lg:grid-cols-8">
            {[null, ...SEEKER_STAGES].map((stage) => {
              const count = stage ? applications.filter((x) => x.stage === stage).length : applications.length
              const picked = only === stage
              return (
                <button
                  key={stage ?? "total"}
                  type="button"
                  onClick={() => setOnly(picked || !stage ? null : stage)}
                  aria-pressed={picked}
                  className={cn(
                    "rounded-xl border bg-card px-2 py-2 text-start transition-colors hover:border-foreground/30 sm:px-3 sm:py-2.5",
                    picked && "border-primary ring-1 ring-primary",
                    count === 0 && stage && "text-muted-foreground"
                  )}
                >
                  <span className="block text-[11px] leading-tight break-words text-muted-foreground sm:text-xs">{stage ? t(`applications.stages.${stage}`) : t("applications.total")}</span>
                  <span className={cn("text-xl font-semibold tabular-nums", stage === "accepted" && count > 0 && "text-emerald-700", stage === "rejected" && count > 0 && "text-red-600")}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {shown.length === 0 ? (
            <p className="rounded-xl border bg-card px-5 py-8 text-center text-sm text-muted-foreground">{applications.length ? t("applications.noMatch") : t("applications.noActive")}</p>
          ) : (
            <ul className="space-y-3">
              {shown.map(({ application, job, stage, thread }) => (
                <li key={application.id} className="rounded-xl border bg-card p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                    <div className="min-w-0">
                      <Link href={`/jobs/${job.id}`} className="font-medium hover:underline">
                        {job.title}
                      </Link>
                      <p className="truncate text-sm text-muted-foreground">{[job.company, locationLabel(job.location)].filter(Boolean).join(" · ")}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("applications.appliedAgo", { time: timeAgo(application.createdAt) })}
                      {!takesApplications(job) && ` · ${t("applications.jobClosed")}`}
                    </p>
                  </div>

                  <ApplicationProgress stage={stage} application={application} thread={thread} />

                  {/* Not selected: the employer's reason */}
                  {stage === "rejected" && application.rejectionReason && (
                    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
                      <p className="text-xs font-medium">{t("applications.rejectionReason")}</p>
                      <p className="mt-0.5 whitespace-pre-line">{application.rejectionReason}</p>
                    </div>
                  )}

                  {/* Withdraw at any point until it's decided against them (asks first, in a window); the conversation once the employer wrote */}
                  {(stage !== "rejected" || thread) && (
                    <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                      {stage !== "rejected" && (
                        <button type="button" className="text-blue-700 underline underline-offset-4 hover:text-blue-800" onClick={() => setWithdrawing(application.id)}>
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
                </li>
              ))}
            </ul>
          )}

          {/* Withdrawn applications, kept for their own record */}
          {archived.length > 0 && (
            <section className="rounded-xl border bg-card">
              <button
                type="button"
                onClick={() => setArchiveOpen((o) => !o)}
                aria-expanded={archiveOpen}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-start font-medium sm:px-5"
              >
                <span className="flex items-center gap-2">
                  <ArchiveIcon className="size-4 text-muted-foreground" />
                  {t("applications.archive")}
                  <span className="rounded-full bg-muted px-2 text-xs tabular-nums">{archived.length}</span>
                </span>
                <ChevronDownIcon className={cn("size-4 text-muted-foreground transition-transform", archiveOpen && "rotate-180")} />
              </button>
              {archiveOpen && (
                // Laid out like the applications above: how far each had got, then when it was withdrawn
                <ul className="space-y-3 border-t p-3 sm:p-4">
                  {archived.map(({ application, job, stage, thread }) => (
                    <li key={application.id} className="rounded-xl border p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                        <div className="min-w-0">
                          <Link href={`/jobs/${job.id}`} className="font-medium hover:underline">
                            {job.title}
                          </Link>
                          <p className="truncate text-sm text-muted-foreground">{[job.company, locationLabel(job.location)].filter(Boolean).join(" · ")}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{t("applications.appliedAgo", { time: timeAgo(application.createdAt) })}</p>
                      </div>
                      <ApplicationProgress stage={stage} application={application} thread={thread} />
                      <p className="mt-3 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                        <ArchiveIcon className="size-4 shrink-0" />
                        {t("applications.withdrawnOn", {
                          date: new Date(application.withdrawnAt!).toLocaleDateString(locale === "en" ? "en-GB" : locale, { day: "numeric", month: "short", year: "numeric" }),
                          time: new Date(application.withdrawnAt!).toLocaleTimeString(locale === "en" ? "en-GB" : locale, { hour: "2-digit", minute: "2-digit" }),
                        })}
                      </p>
                      {/* Coming back: ask once (the employer decides), then where the request stands */}
                      {!application.reinstateRequest ? (
                        <button
                          type="button"
                          className="mt-3 text-sm text-blue-700 underline underline-offset-4 hover:text-blue-800"
                          onClick={() => {
                            setBackMessage("")
                            setAskingBack(application.id)
                          }}
                        >
                          {t("applications.askBack")}
                        </button>
                      ) : application.reinstateRequest.status === "pending" ? (
                        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                          {t("applications.requestPending", { time: timeAgo(application.reinstateRequest.at) })}
                          {application.reinstateRequest.message && <span className="mt-0.5 block text-amber-800">“{application.reinstateRequest.message}”</span>}
                        </p>
                      ) : (
                        application.reinstateRequest.status === "declined" && (
                          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
                            <p className="text-xs font-medium">{t("applications.requestDeclined")}</p>
                            {application.reinstateRequest.reason && <p className="mt-0.5 whitespace-pre-line">{application.reinstateRequest.reason}</p>}
                          </div>
                        )
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}
      <Dialog open={askingBack !== null} onOpenChange={(o) => !o && setAskingBack(null)}>
        <DialogContent className="sm:max-w-md">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!askingBack) return
              const sent = requestReinstate(askingBack, backMessage)
              if (!sent.ok) return toast.error(sent.error)
              setAskingBack(null)
              toast.success(t("applications.requestSent"))
            }}
            className="space-y-4"
          >
            <DialogHeader>
              <DialogTitle>{t("applications.askBackTitle")}</DialogTitle>
            </DialogHeader>
            {(() => {
              const job = mine.find((x) => x.application.id === askingBack)?.job
              return (
                job && (
                  <p className="text-sm">
                    <span className="font-medium">{job.title}</span>
                    <span className="text-muted-foreground"> · {job.company}</span>
                  </p>
                )
              )
            })()}
            <p className="text-sm text-muted-foreground">{t("applications.askBackHint")}</p>
            <Textarea
              value={backMessage}
              onChange={(e) => setBackMessage(e.target.value)}
              placeholder={t("applications.askBackPlaceholder")}
              className="min-h-24 text-sm"
              maxLength={500}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAskingBack(null)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit">{t("applications.sendRequest")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <WithdrawDialog
        job={mine.find((x) => x.application.id === withdrawing)?.job ?? null}
        open={withdrawing !== null}
        onOpenChange={(o) => !o && setWithdrawing(null)}
        onConfirm={() => {
          if (withdrawing) withdraw(withdrawing)
          setWithdrawing(null)
          toast.success(t("applications.withdrawn"))
        }}
      />
    </div>
  )
}
