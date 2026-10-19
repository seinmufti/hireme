"use client"

import { useMemo } from "react"
import { ConversationList } from "@/components/inbox/conversation-list"
import { firstName } from "@/lib/format"
import { useStore } from "@/lib/store"
import { useRoleGuard } from "@/lib/use-role-guard"

export function InboxShell({ children }: { children: React.ReactNode }) {
  const user = useRoleGuard(["EMPLOYER", "SEEKER"])
  const users = useStore((s) => s.users)
  const talents = useStore((s) => s.talents)
  const conversations = useStore((s) => s.conversations)
  const messages = useStore((s) => s.messages)

  const items = useMemo(() => {
    if (!user) return []
    const isEmployer = user.role === "EMPLOYER"
    return conversations
      .filter((c) => (isEmployer ? c.employerId : c.seekerId) === user.id)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .flatMap((c) => {
        const other = users.find((u) => u.id === (isEmployer ? c.seekerId : c.employerId))
        if (!other) return []
        const thread = messages.filter((m) => m.conversationId === c.id)
        const last = thread.at(-1)
        return [
          {
            id: c.id,
            // Employers only ever see a job seeker's first name
            name: isEmployer ? firstName(other.name) : other.name,
            avatarColor: other.avatarColor,
            subtitle: isEmployer
              ? (talents.find((t) => t.userId === other.id)?.experiences[0]?.title ?? "Job seeker")
              : other.company || "Employer",
            preview: last ? `${last.senderId === user.id ? "You: " : ""}${last.body}` : "",
            at: c.updatedAt,
            unread: thread.filter((m) => m.senderId !== user.id && !m.readAt).length,
          },
        ]
      })
  }, [user, users, talents, conversations, messages])

  if (!user) return null

  return (
    <div className="grid h-[calc(100dvh-8rem)] grid-cols-[340px_1fr] overflow-hidden rounded-xl border bg-card">
      <ConversationList
        items={items}
        emptyHint={
          user.role === "EMPLOYER"
            ? "Find someone in The Pool and send them a message."
            : "When an employer messages you, it will show up here."
        }
      />
      <div className="flex min-h-0 flex-col border-l">{children}</div>
    </div>
  )
}
