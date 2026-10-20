"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { BellIcon, SparklesIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { timeAgo } from "@/lib/format"
import { locationLabel } from "@/lib/jobs"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

/**
 * The signed-in user's notifications ("a new job matches your profile"), newest first.
 * Self-contained, so it can sit in the header dropdown or in a side panel.
 * `onNavigate` runs when a notification is opened (e.g. to close the dropdown).
 */
export function NotificationList({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  const router = useRouter()
  const userId = useStore((s) => s.currentUserId)
  const all = useStore((s) => s.notifications)
  const jobs = useStore((s) => s.jobs)
  const markRead = useStore((s) => s.markNotificationRead)
  const markAllRead = useStore((s) => s.markAllNotificationsRead)

  const items = useMemo(
    () =>
      all
        .filter((n) => n.userId === userId)
        .flatMap((n) => {
          const job = jobs.find((j) => j.id === n.jobId)
          return job ? [{ ...n, job }] : []
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [all, jobs, userId]
  )
  const unread = items.filter((n) => !n.readAt).length

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-sm font-medium">
          Notifications
          {unread > 0 && <span className="ml-1.5 text-xs font-normal text-muted-foreground">{unread} new</span>}
        </span>
        {unread > 0 && (
          <Button variant="link" size="xs" onClick={markAllRead}>
            Mark all as read
          </Button>
        )}
      </div>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
          <BellIcon className="size-5" />
          <p>No notifications yet. We&apos;ll let you know when a new job matches your profile.</p>
        </div>
      ) : (
        <ul className="min-h-0 overflow-y-auto p-1">
          {items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => {
                  markRead(n.id)
                  onNavigate?.()
                  router.push(`/jobs/${n.job.id}`)
                }}
                className={cn("flex w-full items-start gap-2.5 rounded-md px-2 py-2 text-left hover:bg-muted", !n.readAt && "bg-brand-soft/60")}
              >
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <SparklesIcon className="size-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-muted-foreground">New job matches your profile</span>
                  <span className="block truncate text-sm font-medium">{n.job.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {n.job.company} · {locationLabel(n.job.location)} · {timeAgo(n.createdAt)}
                  </span>
                </span>
                {!n.readAt && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
