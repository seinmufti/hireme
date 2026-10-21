"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { ArrowLeftIcon, BriefcaseIcon } from "lucide-react"
import { ReplyBox } from "@/components/inbox/reply-box"
import { ThreadMessages } from "@/components/inbox/thread-messages"
import { latestJob } from "@/components/pool/talent-meta"
import { UserAvatar } from "@/components/user-avatar"
import { firstName } from "@/lib/format"
import { conversationJob, useCurrentUser, useStore } from "@/lib/store"
import { useT } from "@/i18n/provider"

export function ThreadView({ id }: { id: string }) {
  const t = useT()
  const user = useCurrentUser()
  const users = useStore((s) => s.users)
  const talents = useStore((s) => s.talents)
  const conversation = useStore((s) => s.conversations.find((c) => c.id === id))
  const allMessages = useStore((s) => s.messages)
  const jobs = useStore((s) => s.jobs)
  const applications = useStore((s) => s.applications)
  const markRead = useStore((s) => s.markRead)

  const mine = !!user && !!conversation && (conversation.employerId === user.id || conversation.seekerId === user.id)
  const messages = useMemo(() => allMessages.filter((m) => m.conversationId === id), [allMessages, id])

  // Opening a thread (or receiving in it) marks the other side's messages as read
  useEffect(() => {
    if (mine) markRead(id)
  }, [mine, id, messages.length, markRead])

  if (!user || !conversation || !mine) {
    return <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">{t("inbox.notFound")}</div>
  }

  const isEmployer = user.role === "EMPLOYER"
  const other = users.find((u) => u.id === (isEmployer ? conversation.seekerId : conversation.employerId))
  if (!other) return null
  const talent = talents.find((t) => t.userId === other.id)
  const job = conversationJob(conversation, jobs, applications)
  // Employers only ever see a job seeker's first name
  const otherName = isEmployer ? firstName(other.name) : other.name
  const subtitle = isEmployer
    ? (talent ? latestJob(talent.experiences) : t("inbox.jobSeeker"))
    : [other.title, other.company].filter(Boolean).join(" · ")

  return (
    <>
      <div className="flex items-center gap-3 border-b px-4 py-3 lg:px-6 lg:py-4">
        {/* Phones and tablets: back to the list of conversations */}
        <Link href="/inbox" aria-label={t("inbox.title")} className="-ms-1 flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-muted lg:hidden">
          <ArrowLeftIcon className="size-4 rtl:rotate-180" />
        </Link>
        <UserAvatar name={otherName} color={other.avatarColor} size={40} />
        <div className="min-w-0 flex-1">
          <div className="font-semibold">{otherName}</div>
          <div className="truncate text-sm text-muted-foreground">{subtitle}</div>
        </div>
        {/* The job this conversation is about, if any */}
        {job && (
          <Link
            href={`/jobs/${job.id}`}
            className="flex max-w-[45%] shrink-0 items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1 text-sm hover:bg-muted"
            title={t("inbox.aboutJob", { job: job.title })}
          >
            <BriefcaseIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{job.title}</span>
          </Link>
        )}
      </div>
      <ThreadMessages
        messages={messages.map((m) => ({
          id: m.id,
          body: m.body,
          mine: m.senderId === user.id,
          at: m.createdAt,
          read: !!m.readAt,
        }))}
      />
      <ReplyBox conversationId={id} placeholder={t("inbox.replyTo", { name: firstName(other.name) })} />
    </>
  )
}
