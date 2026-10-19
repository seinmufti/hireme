"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { UserAvatar } from "@/components/user-avatar"
import { timeAgo } from "@/lib/format"
import { cn } from "@/lib/utils"

type Item = {
  id: string
  name: string
  avatarColor: string
  subtitle: string
  preview: string
  at: string
  unread: number
}

export function ConversationList({ items, emptyHint }: { items: Item[]; emptyHint: string }) {
  const { id: activeId } = useParams<{ id?: string }>()

  return (
    <div className="flex min-h-0 flex-col">
      <div className="border-b px-5 py-4">
        <h1 className="font-semibold">Inbox</h1>
        <p className="text-xs text-muted-foreground">{items.length} conversation{items.length === 1 ? "" : "s"}</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 && <p className="px-5 py-10 text-center text-sm text-muted-foreground">{emptyHint}</p>}
        {items.map((c) => (
          <Link
            key={c.id}
            href={`/inbox/${c.id}`}
            className={cn(
              "flex gap-3 border-b px-5 py-3.5 transition-colors hover:bg-muted/60",
              activeId === c.id && "bg-brand-soft hover:bg-brand-soft"
            )}
          >
            <UserAvatar name={c.name} color={c.avatarColor} size={38} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className={cn("truncate text-sm", c.unread ? "font-semibold" : "font-medium")}>{c.name}</span>
                <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">{timeAgo(c.at)}</span>
              </div>
              <div className="truncate text-xs text-muted-foreground">{c.subtitle}</div>
              <div className="mt-0.5 flex items-center gap-2">
                <span className={cn("truncate text-xs", c.unread ? "text-foreground" : "text-muted-foreground")}>{c.preview}</span>
                {c.unread > 0 && (
                  <span className="ml-auto shrink-0 rounded-full bg-primary px-1.5 text-[10px] leading-4 font-semibold text-primary-foreground">
                    {c.unread}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
