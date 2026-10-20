"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BellIcon, Building2Icon, TargetIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLocationLabel, useT, useTimeAgo, useExactDate } from "@/i18n/provider"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

/**
 * The signed-in user's notifications ("a new job matches your profile"), newest first.
 * Self-contained, so it can sit in the header dropdown or, roomier (`section`), as a section on Home.
 * `onNavigate` runs when a notification is opened (e.g. to close the dropdown). With `limit`, only the newest
 * few show, followed by "See all notifications" when there are more.
 */
export function NotificationList({
  onNavigate,
  section,
  limit,
  className,
}: {
  onNavigate?: () => void
  section?: boolean
  limit?: number
  className?: string
}) {
  const router = useRouter()
  const t = useT()
  const exact = useExactDate()
  const timeAgo = useTimeAgo()
  const locationLabel = useLocationLabel()
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
      <div className={cn("flex items-center justify-between border-b", section ? "gap-3 px-5 py-4" : "px-3 py-2")}>
        {section ? (
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-primary">
              <BellIcon className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="font-semibold">{t("notifications.title")}</h2>
              <p className="text-sm text-muted-foreground">{unread > 0 ? t("notifications.newCount", { count: unread }) : t("notifications.allRead")}</p>
            </div>
          </div>
        ) : (
          <span className="text-sm font-medium">
            {t("notifications.title")}
            {unread > 0 && <span className="ms-1.5 text-xs font-normal text-muted-foreground">{t("notifications.newCount", { count: unread })}</span>}
          </span>
        )}
        {unread > 0 && (
          <Button variant="link" size="xs" onClick={markAllRead}>
            {t("notifications.markAllRead")}
          </Button>
        )}
      </div>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
          <BellIcon className="size-5" />
          <p>{t("notifications.empty")}</p>
        </div>
      ) : (
        <ul className={cn("min-h-0 overflow-y-auto", section ? "divide-y" : "p-1")}>
          {(limit ? items.slice(0, limit) : items).map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => {
                  markRead(n.id)
                  onNavigate?.()
                  router.push(`/jobs/${n.job.id}`)
                }}
                className={cn(
                  "flex w-full items-start gap-2.5 text-start hover:bg-muted",
                  section ? "gap-3 px-5 py-3.5" : "rounded-md px-2 py-2",
                  !n.readAt && "bg-brand-soft/60"
                )}
              >
                {/* A job that matches them, or one from a company they follow */}
                <span
                  className={cn(
                    "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                    n.kind === "follow" ? "bg-muted text-foreground" : "bg-emerald-50 text-emerald-700"
                  )}
                >
                  {n.kind === "follow" ? <Building2Icon className="size-3.5" /> : <TargetIcon className="size-3.5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-muted-foreground">
                    {n.kind === "follow" ? t("notifications.newFromFollowed", { company: n.job.company }) : t("notifications.newJob")}
                  </span>
                  <span className="block truncate text-sm font-medium">{n.job.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {n.job.company} · {locationLabel(n.job.location)} · <span title={exact(n.createdAt)}>{timeAgo(n.createdAt)}</span>
                  </span>
                </span>
                {!n.readAt && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-label={t("notifications.unread")} />}
              </button>
            </li>
          ))}
        </ul>
      )}
      {limit && items.length > limit && (
        <Link
          href="/notifications"
          onClick={onNavigate}
          className="border-t px-3 py-2 text-center text-sm font-medium text-primary hover:bg-muted"
        >
          {t("notifications.seeAll", { count: items.length })}
        </Link>
      )}
    </div>
  )
}
