"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { CheckCircle2Icon, FileUserIcon, MessageSquareTextIcon, SendIcon, UsersIcon } from "lucide-react"
import { toast } from "sonner"
import { ProfilePhoto } from "@/components/cv/photo"
import { MessageDialog } from "@/components/pool/message-dialog"
import { TalentProfileDialog } from "@/components/pool/talent-profile-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { formatDuration, timeAgo } from "@/lib/format"
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

export function ApplicationStatus({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium", STATUS_STYLE[status], className)}>
      {status}
    </span>
  )
}

/** The signed-in job seeker's application to this job, if any. */
export const useMyApplication = (jobId: string, seekerId: string) =>
  useStore((s) => s.applications.find((a) => a.jobId === jobId && a.seekerId === seekerId)) ?? null

/** For job seekers on a job's page: apply, or see where their application stands. */
export function ApplyPanel({ job, viewer }: { job: Job; viewer: User }) {
  const application = useMyApplication(job.id, viewer.id)
  const talent = useStore((s) => s.talents.find((t) => t.userId === viewer.id)) ?? null
  const withdraw = useStore((s) => s.withdrawApplication)
  const [open, setOpen] = useState(false)
  const cvReady = listingMissing(viewer, talent).length === 0

  if (application) {
    return (
      <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-sm">
        <p className="flex items-center gap-1.5 font-medium">
          <CheckCircle2Icon className="size-4 text-emerald-600" /> You applied {timeAgo(application.createdAt)}
        </p>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          Status: <ApplicationStatus status={application.status} />
        </p>
        {application.status === "Applied" && (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 text-muted-foreground"
            onClick={() => {
              withdraw(application.id)
              toast.success("Application withdrawn")
            }}
          >
            Withdraw application
          </Button>
        )}
      </div>
    )
  }

  if (!job.open) return null

  if (!cvReady) {
    return (
      <div className="space-y-2">
        <Button className="w-full" disabled>
          <SendIcon /> Apply
        </Button>
        <p className="text-xs text-muted-foreground">
          Finish your <Link href="/profile" className="underline">CV</Link> first. The yellow sections still need details.
        </p>
      </div>
    )
  }

  return (
    <>
      <Button className="w-full" onClick={() => setOpen(true)}>
        <SendIcon /> Apply
      </Button>
      <ApplyDialog job={job} open={open} onOpenChange={setOpen} />
    </>
  )
}

function ApplyDialog({ job, open, onOpenChange }: { job: Job; open: boolean; onOpenChange: (open: boolean) => void }) {
  const applyToJob = useStore((s) => s.applyToJob)
  const [note, setNote] = useState("")

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const res = applyToJob(job.id, note)
    if (!res.ok) return toast.error(res.error)
    toast.success(`Applied to ${job.title}`)
    setNote("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Apply to {job.title}</DialogTitle>
            <DialogDescription>
              {job.company} will see your CV, without your contact details. They can reply through HireMe messages.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <label htmlFor="apply-note" className="text-sm font-medium">
              Note to the employer <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              id="apply-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              maxLength={600}
              placeholder="Why you're a good fit for this job"
            />
          </div>
          <DialogFooter>
            <Link href="/profile/cv" className={buttonVariants({ variant: "ghost" })}>
              <FileUserIcon /> Check my CV
            </Link>
            <Button type="submit">
              <SendIcon /> Send application
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** For the employer on their job's page: everyone who applied, newest first. */
export function ApplicantsList({ job, viewer }: { job: Job; viewer: User }) {
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
          <UsersIcon className="size-4 text-muted-foreground" /> Applicants
          <span className="text-sm font-normal text-muted-foreground">{applicants.length}</span>
        </h2>
      </header>
      {applicants.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">No one has applied yet.</p>
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
                toast.success(`${talent.firstName}: ${status}`)
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
  return (
    <li className="flex items-start gap-4 px-5 py-4">
      <button type="button" onClick={onView} className="shrink-0" aria-label={`View ${talent.firstName}'s CV`}>
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
          {[talent.totalMonths ? `${formatDuration(talent.totalMonths)} experience` : "No experience yet", talent.city, `applied ${timeAgo(application.createdAt)}`]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {application.note && <p className="rounded-md bg-muted/50 px-3 py-2 text-sm whitespace-pre-line">{application.note}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Select value={application.status} onValueChange={(v) => v && onStatus(v as string)}>
          <SelectTrigger size="sm" className="w-36" aria-label={`Status of ${talent.firstName}'s application`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {APPLICATION_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={onView}>
          <FileUserIcon /> CV
        </Button>
        {talent.conversationId ? (
          <Link href={`/inbox/${talent.conversationId}`} className={buttonVariants({ variant: "ghost", size: "sm" })} aria-label="Open conversation">
            <MessageSquareTextIcon />
          </Link>
        ) : (
          <Button variant="ghost" size="sm" onClick={onMessage} aria-label={`Message ${talent.firstName}`}>
            <MessageSquareTextIcon />
          </Button>
        )}
      </div>
    </li>
  )
}
