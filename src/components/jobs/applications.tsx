"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { CheckCircle2Icon, FileUserIcon, MessageSquareTextIcon, RotateCcwIcon, SearchIcon, SendIcon, UsersIcon } from "lucide-react"
import { toast } from "sonner"
import { ProfilePhoto } from "@/components/cv/photo"
import { MessageDialog } from "@/components/pool/message-dialog"
import { TalentProfileDialog } from "@/components/pool/talent-profile-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ApplicationProgress } from "./application-progress"
import { useT, useTimeAgo } from "@/i18n/provider"
import { formatDuration } from "@/lib/format"
import { takesApplications } from "@/lib/jobs"
import { SEEKER_STAGES, seekerStage, type SeekerStage } from "@/lib/application-stage"
import { APPLICATION_STATUSES } from "@/lib/options"
import { toPoolTalent } from "@/lib/pool-talent"
import { listingMissing, useStore } from "@/lib/store"
import type { Application, Conversation, Job, User } from "@/lib/types"
import { cn } from "@/lib/utils"

const STATUS_KEY: Record<string, string> = {
  Applied: "statusApplied",
  Shortlisted: "statusShortlisted",
  Contacted: "statusContacted",
  Interview: "statusInterview",
  Accepted: "statusAccepted",
  "Not selected": "statusNotSelected",
}

/** A status in the current language (statuses are stored in English). */
export function useStatusLabel() {
  const t = useT()
  return (status: string) => t.dynamic(`applications.${STATUS_KEY[status] ?? "statusApplied"}`, status)
}

/** Withdrawing an application: asks first, in a window (the employer is told). */
export function WithdrawDialog({
  job,
  open,
  onOpenChange,
  onConfirm,
}: {
  job: Pick<Job, "title" | "company"> | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  const t = useT()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("applications.withdrawTitle")}</DialogTitle>
        </DialogHeader>
        {job && (
          <p className="text-sm">
            <span className="font-medium">{job.title}</span>
            <span className="text-muted-foreground"> · {job.company}</span>
          </p>
        )}
        <p className="text-sm text-muted-foreground">{t("applications.withdrawExplain")}</p>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            {t("applications.withdrawShort")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** The signed-in job seeker's application to this job, if any. */
export const useMyApplication = (jobId: string, seekerId: string) =>
  useStore((s) => s.applications.find((a) => a.jobId === jobId && a.seekerId === seekerId)) ?? null

/** For job seekers on a job's page: apply, or see where their application stands. */
export function ApplyPanel({ job, viewer }: { job: Job; viewer: User }) {
  const t = useT()
  const timeAgo = useTimeAgo()
  const application = useMyApplication(job.id, viewer.id)
  const conversations = useStore((s) => s.conversations)
  const talent = useStore((s) => s.talents.find((t) => t.userId === viewer.id)) ?? null
  const withdraw = useStore((s) => s.withdrawApplication)
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const cvReady = listingMissing(viewer, talent).length === 0

  // Withdrawn: said so (it's in their archive); applying again isn't possible
  if (application?.withdrawnAt) {
    return (
      <p className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
        {t("applications.youWithdrew", { time: timeAgo(application.withdrawnAt) })}
      </p>
    )
  }
  if (application) {
    return (
      <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-sm">
        <p className="flex items-center gap-1.5 font-medium">
          <CheckCircle2Icon className="size-4 text-emerald-600" /> {t("applications.youApplied", { time: timeAgo(application.createdAt) })}
        </p>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          {/* Where it stands for them (as on their Applications board) */}
          {t("applications.status")}{" "}
          <span className="inline-flex shrink-0 items-center rounded-full border bg-card px-2 py-0.5 text-xs font-medium text-foreground">
            {t(`applications.stages.${seekerStage(application, job, conversations)}`)}
          </span>
        </p>
        {/* Withdraw at any point until it's decided against them, after confirming in a window */}
        {application.status !== "Not selected" && (
          <Button variant="ghost" size="sm" className="-ms-2 text-muted-foreground" onClick={() => setConfirming(true)}>
            {t("applications.withdraw")}
          </Button>
        )}
        <WithdrawDialog
          job={job}
          open={confirming}
          onOpenChange={setConfirming}
          onConfirm={() => {
            withdraw(application.id)
            setConfirming(false)
            toast.success(t("applications.withdrawn"))
          }}
        />
      </div>
    )
  }

  if (!takesApplications(job)) return null

  if (!cvReady) {
    return (
      <div className="space-y-2">
        <Button className="w-full" disabled>
          <SendIcon /> {t("applications.apply")}
        </Button>
        <p className="text-xs text-muted-foreground">
          {t("applications.finishCvFirst")}{" "}
          <Link href="/overview" className="underline">{t("applications.finishCv")}</Link>
        </p>
      </div>
    )
  }

  return (
    <>
      <Button className="w-full" onClick={() => setOpen(true)}>
        <SendIcon /> {t("applications.apply")}
      </Button>
      <ApplyDialog job={job} open={open} onOpenChange={setOpen} />
    </>
  )
}

/** For job seekers on a job card: an Apply button that opens the same dialog as the job's page. */
export function QuickApply({ job, className }: { job: Job; className?: string }) {
  const t = useT()
  const viewer = useStore((s) => s.users.find((u) => u.id === s.currentUserId))
  const talent = useStore((s) => s.talents.find((x) => x.userId === s.currentUserId)) ?? null
  const [open, setOpen] = useState(false)
  if (!viewer || !takesApplications(job)) return null
  // Guests sign in (or create an account) first
  if (viewer.role === "GUEST") {
    return (
      <Link href="/login" className={buttonVariants({ size: "sm", className })}>
        <SendIcon /> {t("applications.apply")}
      </Link>
    )
  }
  const cvReady = listingMissing(viewer, talent).length === 0

  return (
    <>
      <Button
        size="sm"
        className={className}
        onClick={() => (cvReady ? setOpen(true) : toast.error(t("applications.finishCvFirst")))}
      >
        <SendIcon /> {t("applications.apply")}
      </Button>
      <ApplyDialog job={job} open={open} onOpenChange={setOpen} />
    </>
  )
}

function ApplyDialog({ job, open, onOpenChange }: { job: Job; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT()
  const applyToJob = useStore((s) => s.applyToJob)
  const [note, setNote] = useState("")

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const res = applyToJob(job.id, note)
    if (!res.ok) return toast.error(res.error)
    toast.success(t("applications.sent", { job: job.title }))
    setNote("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{t("applications.dialogTitle", { job: job.title })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <label htmlFor="apply-note" className="text-sm font-medium">
              {t("applications.note")} <span className="font-normal text-muted-foreground">{t("applications.optional")}</span>
            </label>
            <Textarea
              id="apply-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              maxLength={600}
              placeholder={t("applications.notePlaceholder")}
            />
          </div>
          <DialogFooter>
            <Button type="submit">
              <SendIcon /> {t("applications.send")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * For the employer on their job's page: everyone who applied, like the job seeker's Applications page: how many
 * are at each stage (tiles that also filter), then each applicant with their progress, newest first, and the
 * status to move them on.
 */
export function ApplicantsList({ job, viewer }: { job: Job; viewer: User }) {
  const t = useT()
  const statusLabel = useStatusLabel()
  const all = useStore((s) => s.applications)
  const users = useStore((s) => s.users)
  const talents = useStore((s) => s.talents)
  const conversations = useStore((s) => s.conversations)
  const setStatus = useStore((s) => s.setApplicationStatus)
  const markViewed = useStore((s) => s.markApplicationViewed)
  const [viewing, setViewingState] = useState<string | null>(null)
  // Opening an applicant's CV: they see their application as viewed
  const setViewing = (id: string | null) => {
    if (id) markViewed(id)
    setViewingState(id)
  }
  const [messaging, setMessaging] = useState<string | null>(null)
  // The tile picked (null: everyone), and a name or profession to find
  const [only, setOnly] = useState<SeekerStage | null>(null)
  const [query, setQuery] = useState("")

  const applicants = useMemo(
    () =>
      all
        // Withdrawn ones are gone from the board
        .filter((a) => a.jobId === job.id && !a.withdrawnAt)
        .flatMap((a) => {
          const u = users.find((x) => x.id === a.seekerId)
          const t = talents.find((x) => x.userId === a.seekerId)
          if (!u || !t) return []
          const thread = conversations.find((c) => c.employerId === viewer.id && c.seekerId === u.id)
          return [{ application: a, talent: toPoolTalent(u, t, thread ? thread.id : null), stage: seekerStage(a, job, conversations), thread }]
        })
        .sort((a, b) => b.application.createdAt.localeCompare(a.application.createdAt)),
    [all, users, talents, conversations, job, viewer.id]
  )
  const find = (id: string | null) => applicants.find((x) => x.application.id === id)?.talent ?? null
  // Not selecting someone asks why first (the job seeker sees it); other moves happen right away
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [reason, setReason] = useState("")
  const move = (applicationId: string, status: string, why?: string) => {
    const a = applicants.find((x) => x.application.id === applicationId)
    if (!a || a.application.status === status) return
    if (status === "Not selected" && why === undefined) {
      setReason("")
      setRejecting(applicationId)
      return
    }
    setStatus(applicationId, status, why)
    toast.success(`${a.talent.firstName}: ${statusLabel(status)}`)
  }
  const rejectingName = applicants.find((x) => x.application.id === rejecting)?.talent.firstName ?? ""

  // Withdrawn applicants asking to come back: take them back, or decline with a reason
  const answerReinstate = useStore((s) => s.answerReinstate)
  const requests = useMemo(
    () =>
      all
        .filter((a) => a.withdrawnAt && a.reinstateRequest?.status === "pending" && a.jobId === job.id)
        .map((a) => ({ application: a, name: users.find((u) => u.id === a.seekerId)?.name.split(" ")[0] ?? "" }))
        .sort((a, b) => b.application.reinstateRequest!.at.localeCompare(a.application.reinstateRequest!.at)),
    [all, job.id, users]
  )
  const [declining, setDeclining] = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState("")
  const decliningName = requests.find((x) => x.application.id === declining)?.name ?? ""

  return (
    <section id="applicants" className="scroll-mt-20 rounded-xl border bg-card">
      <header className="flex items-center justify-between gap-3 border-b px-5 py-3">
        <h2 className="flex items-center gap-2 font-semibold">
          <UsersIcon className="size-4 text-muted-foreground" /> {t("applications.applicants")}
          <span className="text-sm font-normal text-muted-foreground">{applicants.length}</span>
        </h2>
      </header>
      {requests.length > 0 && (
        <div className="space-y-2 border-b bg-amber-50/60 px-4 py-4 sm:px-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <RotateCcwIcon className="size-4" /> {t("applications.requests")}
            <span className="rounded-full bg-amber-100 px-2 text-xs tabular-nums">{requests.length}</span>
          </h3>
          <ul className="space-y-2">
            {requests.map(({ application, name }) => (
              <li key={application.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-card px-3 py-2.5">
                <div className="min-w-0 text-sm">
                  <p className="font-medium">
                    {name}
                  </p>
                  {application.reinstateRequest!.message && <p className="mt-0.5 whitespace-pre-line text-muted-foreground">“{application.reinstateRequest!.message}”</p>}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      answerReinstate(application.id, true)
                      toast.success(t("applications.requestAccepted", { name }))
                    }}
                  >
                    {t("applications.accept")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setDeclineReason("")
                      setDeclining(application.id)
                    }}
                  >
                    {t("applications.decline")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {applicants.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">{t("applications.noApplicants")}</p>
      ) : (
        <div className="space-y-4 p-4 sm:p-5">
          {/* How many are at each stage; a tile shows just those (again: everyone) */}
          <div className="grid grid-cols-4 gap-2 lg:grid-cols-8">
            {[null, ...SEEKER_STAGES].map((stage) => {
              const count = stage ? applicants.filter((x) => x.stage === stage).length : applicants.length
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
                  <span className="block text-[11px] leading-tight break-words text-muted-foreground sm:text-xs">
                    {stage ? t(`applications.stages.${stage}`) : t("applications.total")}
                  </span>
                  <span className={cn("text-xl font-semibold tabular-nums", stage === "accepted" && count > 0 && "text-emerald-700", stage === "rejected" && count > 0 && "text-red-600")}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("applications.searchApplicants")}
              aria-label={t("applications.searchApplicants")}
              className="h-9 ps-9 sm:w-72"
            />
          </div>

          {(() => {
            const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
            const shown = applicants.filter(({ stage, talent }) => {
              if (only && stage !== only) return false
              const text = `${talent.firstName} ${talent.title}`.toLowerCase()
              return words.every((w) => text.includes(w))
            })
            return shown.length === 0 ? (
              <p className="rounded-xl border px-5 py-8 text-center text-sm text-muted-foreground">{t("applications.noMatch")}</p>
            ) : (
              <ul className="space-y-3">
                {shown.map(({ application, talent, stage, thread }) => (
                  <ApplicantCard
                    key={application.id}
                    application={application}
                    talent={talent}
                    stage={stage}
                    thread={thread}
                    onView={() => setViewing(application.id)}
                    onMessage={() => setMessaging(application.id)}
                    onStatus={(next) => move(application.id, next)}
                  />
                ))}
              </ul>
            )
          })()}
        </div>
      )}

      <TalentProfileDialog
        talent={find(viewing)}
        open={viewing !== null}
        onOpenChange={(o) => !o && setViewing(null)}
        canMessage
        onMessage={() => {
          setMessaging(viewing)
          setViewing(null)
        }}
      />
      <Dialog open={rejecting !== null} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent className="sm:max-w-md">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!reason.trim()) return toast.error(t("applications.reasonNeeded"))
              if (rejecting) move(rejecting, "Not selected", reason)
              setRejecting(null)
            }}
            className="space-y-4"
          >
            <DialogHeader>
              <DialogTitle>{t("applications.rejectTitle", { name: rejectingName })}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">{t("applications.rejectHint")}</p>
            <Textarea
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("applications.rejectPlaceholder")}
              className="min-h-24 text-sm"
              maxLength={500}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setRejecting(null)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit">{t("applications.reject")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={declining !== null} onOpenChange={(o) => !o && setDeclining(null)}>
        <DialogContent className="sm:max-w-md">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!declineReason.trim()) return toast.error(t("applications.reasonNeeded"))
              if (declining) answerReinstate(declining, false, declineReason)
              setDeclining(null)
            }}
            className="space-y-4"
          >
            <DialogHeader>
              <DialogTitle>{t("applications.declineTitle", { name: decliningName })}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">{t("applications.declineHint")}</p>
            <Textarea autoFocus value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} className="min-h-24 text-sm" maxLength={500} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDeclining(null)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit">{t("applications.decline")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <MessageDialog
        talent={find(messaging)}
        sender={{ name: viewer.name, title: viewer.title, company: viewer.company }}
        open={messaging !== null}
        onOpenChange={(o) => !o && setMessaging(null)}
        jobId={job.id}
      />
    </section>
  )
}

function ApplicantCard({
  application,
  talent,
  stage,
  thread,
  onView,
  onMessage,
  onStatus,
}: {
  application: Application
  talent: ReturnType<typeof toPoolTalent>
  stage: SeekerStage
  thread: Conversation | undefined
  onView: () => void
  onMessage: () => void
  onStatus: (status: string) => void
}) {
  const t = useT()
  const timeAgo = useTimeAgo()
  const statusLabel = useStatusLabel()
  return (
    <li className="rounded-xl border p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={onView} className="shrink-0" aria-label={t("applications.viewCv", { name: talent.firstName })}>
            <ProfilePhoto photoId={talent.photoId} name={talent.firstName} color={talent.avatarColor} size={40} />
          </button>
          <div className="min-w-0">
            <button type="button" onClick={onView} className="block truncate font-medium hover:underline">
              {talent.firstName}
            </button>
            <p className="truncate text-sm text-muted-foreground">
              {[talent.title, talent.totalMonths ? t("applications.experience", { duration: formatDuration(talent.totalMonths) }) : t("applications.noExperience")]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{t("applications.appliedAgo", { time: timeAgo(application.createdAt) })}</p>
      </div>

      {application.note && <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-sm whitespace-pre-line">{application.note}</p>}

      <ApplicationProgress stage={stage} application={application} thread={thread} />

      {/* Why they weren't selected (the job seeker sees it too) */}
      {application.status === "Not selected" && application.rejectionReason && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          <p className="text-xs font-medium">{t("applications.rejectionReason")}</p>
          <p className="mt-0.5 whitespace-pre-line">{application.rejectionReason}</p>
        </div>
      )}

      {/* Moving them on, their CV, and writing to them */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Select value={application.status} onValueChange={(v) => v && onStatus(v as string)}>
          <SelectTrigger size="sm" className="h-8 w-44 text-sm" aria-label={t("applications.statusOf", { name: talent.firstName })}>
            <SelectValue>{(v: string) => statusLabel(v)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {APPLICATION_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {statusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" className="text-blue-700 hover:bg-blue-50 hover:text-blue-800" onClick={onView}>
          <FileUserIcon /> <span className="underline underline-offset-4">{t("applications.cv")}</span>
        </Button>
        {talent.conversationId ? (
          <Link href={`/inbox/${talent.conversationId}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-blue-700 hover:bg-blue-50 hover:text-blue-800")}>
            <MessageSquareTextIcon /> <span className="underline underline-offset-4">{t("applications.openConversation")}</span>
          </Link>
        ) : (
          <Button variant="ghost" size="sm" className="text-blue-700 hover:bg-blue-50 hover:text-blue-800" onClick={onMessage}>
            <MessageSquareTextIcon /> <span className="underline underline-offset-4">{t("applications.messageShort")}</span>
          </Button>
        )}
      </div>
    </li>
  )
}
