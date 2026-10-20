"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { CheckCircle2Icon, FileUserIcon, MessageSquareTextIcon, SendIcon, UsersIcon } from "lucide-react"
import { toast } from "sonner"
import { ProfilePhoto } from "@/components/cv/photo"
import { MessageDialog } from "@/components/pool/message-dialog"
import { TalentProfileDialog } from "@/components/pool/talent-profile-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useT, useTimeAgo } from "@/i18n/provider"
import { formatDuration } from "@/lib/format"
import { takesApplications } from "@/lib/jobs"
import { APPLICATION_STATUSES } from "@/lib/options"
import { toPoolTalent } from "@/lib/pool-talent"
import { listingMissing, useStore } from "@/lib/store"
import type { Application, Job, User } from "@/lib/types"
import { cn } from "@/lib/utils"

const STATUS_STYLE: Record<string, string> = {
  Applied: "bg-sky-50 text-sky-900 border-sky-200",
  Shortlisted: "bg-emerald-50 text-emerald-900 border-emerald-300",
  "Not selected": "bg-muted text-muted-foreground border-transparent",
}

/** A status in the current language (statuses are stored in English). */
export function useStatusLabel() {
  const t = useT()
  return (status: string) =>
    status === "Shortlisted" ? t("applications.statusShortlisted") : status === "Not selected" ? t("applications.statusNotSelected") : t("applications.statusApplied")
}

export function ApplicationStatus({ status, className }: { status: string; className?: string }) {
  const label = useStatusLabel()
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium", STATUS_STYLE[status], className)}>
      {label(status)}
    </span>
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
  const talent = useStore((s) => s.talents.find((t) => t.userId === viewer.id)) ?? null
  const withdraw = useStore((s) => s.withdrawApplication)
  const [open, setOpen] = useState(false)
  const cvReady = listingMissing(viewer, talent).length === 0

  if (application) {
    return (
      <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-sm">
        <p className="flex items-center gap-1.5 font-medium">
          <CheckCircle2Icon className="size-4 text-emerald-600" /> {t("applications.youApplied", { time: timeAgo(application.createdAt) })}
        </p>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          {t("applications.status")} <ApplicationStatus status={application.status} />
        </p>
        {application.status === "Applied" && (
          <Button
            variant="ghost"
            size="sm"
            className="-ms-2 text-muted-foreground"
            onClick={() => {
              withdraw(application.id)
              toast.success(t("applications.withdrawn"))
            }}
          >
            {t("applications.withdraw")}
          </Button>
        )}
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
          <Link href="/profile" className="underline">{t("applications.finishCv")}</Link>
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
            <Link href="/profile/cv" className={buttonVariants({ variant: "ghost" })}>
              <FileUserIcon /> {t("applications.checkCv")}
            </Link>
            <Button type="submit">
              <SendIcon /> {t("applications.send")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** For the employer on their job's page: everyone who applied, newest first. */
export function ApplicantsList({ job, viewer }: { job: Job; viewer: User }) {
  const t = useT()
  const statusLabel = useStatusLabel()
  const all = useStore((s) => s.applications)
  const users = useStore((s) => s.users)
  const talents = useStore((s) => s.talents)
  const conversations = useStore((s) => s.conversations)
  const setStatus = useStore((s) => s.setApplicationStatus)
  const [viewing, setViewing] = useState<string | null>(null)
  const [messaging, setMessaging] = useState<string | null>(null)

  const applicants = useMemo(
    () =>
      all
        .filter((a) => a.jobId === job.id)
        .flatMap((a) => {
          const u = users.find((x) => x.id === a.seekerId)
          const t = talents.find((x) => x.userId === a.seekerId)
          if (!u || !t) return []
          const thread = conversations.find((c) => c.employerId === viewer.id && c.seekerId === u.id)
          return [{ application: a, talent: toPoolTalent(u, t, thread ? thread.id : null) }]
        })
        .sort((a, b) => b.application.createdAt.localeCompare(a.application.createdAt)),
    [all, users, talents, conversations, job.id, viewer.id]
  )
  const find = (id: string | null) => applicants.find((x) => x.application.id === id)?.talent ?? null

  return (
    <section id="applicants" className="scroll-mt-20 rounded-xl border bg-card">
      <header className="flex items-center justify-between gap-3 border-b px-5 py-3">
        <h2 className="flex items-center gap-2 font-semibold">
          <UsersIcon className="size-4 text-muted-foreground" /> {t("applications.applicants")}
          <span className="text-sm font-normal text-muted-foreground">{applicants.length}</span>
        </h2>
      </header>
      {applicants.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">{t("applications.noApplicants")}</p>
      ) : (
        <ul className="divide-y">
          {applicants.map(({ application, talent }) => (
            <ApplicantRow
              key={application.id}
              application={application}
              talent={talent}
              onView={() => setViewing(application.id)}
              onMessage={() => setMessaging(application.id)}
              onStatus={(status) => {
                setStatus(application.id, status)
                toast.success(`${talent.firstName}: ${statusLabel(status)}`)
              }}
            />
          ))}
        </ul>
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
      <MessageDialog
        talent={find(messaging)}
        sender={{ name: viewer.name, title: viewer.title, company: viewer.company }}
        open={messaging !== null}
        onOpenChange={(o) => !o && setMessaging(null)}
      />
    </section>
  )
}

function ApplicantRow({
  application,
  talent,
  onView,
  onMessage,
  onStatus,
}: {
  application: Application
  talent: ReturnType<typeof toPoolTalent>
  onView: () => void
  onMessage: () => void
  onStatus: (status: string) => void
}) {
  const t = useT()
  const timeAgo = useTimeAgo()
  const statusLabel = useStatusLabel()
  return (
    <li className="flex items-start gap-4 px-5 py-4">
      <button type="button" onClick={onView} className="shrink-0" aria-label={t("applications.viewCv", { name: talent.firstName })}>
        <ProfilePhoto photoId={talent.photoId} name={talent.firstName} color={talent.avatarColor} size={40} />
      </button>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onView} className="truncate font-medium hover:underline">
            {talent.firstName}
          </button>
          <span className="truncate text-sm text-muted-foreground">{talent.title}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {[
            talent.totalMonths ? t("applications.experience", { duration: formatDuration(talent.totalMonths) }) : t("applications.noExperience"),
            talent.city,
            t("applications.appliedAgo", { time: timeAgo(application.createdAt) }),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {application.note && <p className="rounded-md bg-muted/50 px-3 py-2 text-sm whitespace-pre-line">{application.note}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Select value={application.status} onValueChange={(v) => v && onStatus(v as string)}>
          <SelectTrigger size="sm" className="w-36" aria-label={t("applications.statusOf", { name: talent.firstName })}>
            <SelectValue>{(v: string) => statusLabel(v)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {APPLICATION_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={onView}>
          <FileUserIcon /> {t("applications.cv")}
        </Button>
        {talent.conversationId ? (
          <Link href={`/inbox/${talent.conversationId}`} className={buttonVariants({ variant: "ghost", size: "sm" })} aria-label={t("applications.openConversation")}>
            <MessageSquareTextIcon />
          </Link>
        ) : (
          <Button variant="ghost" size="sm" onClick={onMessage} aria-label={t("applications.message", { name: talent.firstName })}>
            <MessageSquareTextIcon />
          </Button>
        )}
      </div>
    </li>
  )
}
