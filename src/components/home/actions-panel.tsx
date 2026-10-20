"use client"

import { NotificationList } from "@/components/notifications/notification-list"
import { useT } from "@/i18n/provider"
import type { HomeTalent, HomeUser } from "./home-data"
import { WorkPreferenceCard } from "./work-preference"

/** Right sidebar: notifications and the type of work the job seeker wants. */
export function ActionsPanel({ user, talent }: { user: HomeUser; talent: HomeTalent | null }) {
  const t = useT()

  return (
    <aside className="space-y-4">
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("home.actions")}</h2>

      {/* New jobs that match the job seeker (the same list as the bell in the header) */}
      <section className="overflow-hidden rounded-xl border bg-card">
        <NotificationList className="max-h-80" />
      </section>

      <WorkPreferenceCard user={user} talent={talent} />
    </aside>
  )
}
