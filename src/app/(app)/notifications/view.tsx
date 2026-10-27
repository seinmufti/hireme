"use client"

import { NotificationList } from "@/components/notifications/notification-list"
import { useRoleGuard } from "@/lib/use-role-guard"

// Every notification the job seeker or employer has had, newest first.
export function NotificationsView() {
  const viewer = useRoleGuard(["SEEKER", "EMPLOYER"])
  if (!viewer) return null
  return (
    <section className="mx-auto max-w-3xl overflow-hidden rounded-xl border bg-card">
      <NotificationList section />
    </section>
  )
}
