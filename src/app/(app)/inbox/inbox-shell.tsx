"use client"

import { useMemo } from "react"
import { usePathname } from "next/navigation"
import { ConversationList } from "@/components/inbox/conversation-list"
import { firstName } from "@/lib/format"
import { useStore } from "@/lib/store"
import { useRoleGuard } from "@/lib/use-role-guard"
import { useT } from "@/i18n/provider"
import { cn } from "@/lib/utils"

export function InboxShell({ children }: { children: React.ReactNode }) {
  const t = useT()
  const user = useRoleGuard(["EMPLOYER", "SEEKER"])
  const users = useStore((s) => s.users)
  const talents = useStore((s) => s.talents)
  const conversations = useStore((s) => s.conversations)
  const messages = useStore((s) => s.messages)
  // Phones and tablets show one side at a time: the list, or the open conversation
  const inThread = usePathname() !== "/inbox"

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
              ? (talents.find((x) => x.userId === other.id)?.experiences[0]?.title ?? t("inbox.jobSeeker"))
              : other.company || t("inbox.employer"),
            preview: last ? `${last.senderId === user.id ? t("inbox.you") : ""}${last.body}` : "",
            at: c.updatedAt,
            unread: thread.filter((m) => m.senderId !== user.id && !m.readAt).length,
          },
        ]
      })
  }, [user, users, talents, conversations, messages, t])

  if (!user) return null

  return (
    <div className="grid grid-cols-1 h-[calc(100dvh-10rem)] overflow-hidden rounded-xl border bg-card lg:h-[calc(100dvh-11rem)] lg:grid-cols-[340px_1fr]">
      <ConversationList
        className={cn(inThread && "hidden lg:flex")}
        items={items}
        emptyHint={
          user.role === "EMPLOYER"
            ? t("inbox.employerEmpty")
            : t("inbox.seekerEmpty")
        }
        emptyAction={user.role === "EMPLOYER" ? { href: "/pool", label: t("nav.pool") } : { href: "/profile", label: t("nav.cvPreview") }}
      />
      <div className={cn("min-h-0 flex-col lg:flex lg:border-s", inThread ? "flex" : "hidden")}>{children}</div>
    </div>
  )
}
