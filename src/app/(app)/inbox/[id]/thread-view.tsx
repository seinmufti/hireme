"use client"

import { useEffect, useMemo } from "react"
import { ReplyBox } from "@/components/inbox/reply-box"
import { ThreadMessages } from "@/components/inbox/thread-messages"
import { latestJob } from "@/components/pool/talent-meta"
import { UserAvatar } from "@/components/user-avatar"
import { firstName } from "@/lib/format"
import { useCurrentUser, useStore } from "@/lib/store"

export function ThreadView({ id }: { id: string }) {
  const user = useCurrentUser()
  const users = useStore((s) => s.users)
  const talents = useStore((s) => s.talents)
  const conversation = useStore((s) => s.conversations.find((c) => c.id === id))
  const allMessages = useStore((s) => s.messages)
  const markRead = useStore((s) => s.markRead)

  const mine = !!user && !!conversation && (conversation.employerId === user.id || conversation.seekerId === user.id)
  const messages = useMemo(() => allMessages.filter((m) => m.conversationId === id), [allMessages, id])

  // Opening a thread (or receiving in it) marks the other side's messages as read
  useEffect(() => {
    if (mine) markRead(id)
  }, [mine, id, messages.length, markRead])

  if (!user || !conversation || !mine) {
    return <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Conversation not found.</div>
  }

  const isEmployer = user.role === "EMPLOYER"
  const other = users.find((u) => u.id === (isEmployer ? conversation.seekerId : conversation.employerId))
  if (!other) return null
  const talent = talents.find((t) => t.userId === other.id)
  // Employers only ever see a job seeker's first name
  const otherName = isEmployer ? firstName(other.name) : other.name
  const subtitle = isEmployer
    ? (talent ? latestJob(talent.experiences) : "Job seeker")
    : [other.title, other.company].filter(Boolean).join(" · ")

  return (
    <>
      <div className="flex items-center gap-3 border-b px-6 py-4">
        <UserAvatar name={otherName} color={other.avatarColor} size={40} />
        <div>
          <div className="font-semibold">{otherName}</div>
          <div className="text-sm text-muted-foreground">{subtitle}</div>
        </div>
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
      <ReplyBox conversationId={id} placeholder={`Reply to ${firstName(other.name)}…`} />
    </>
  )
}
