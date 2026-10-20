"use client"

import { ActionsPanel } from "@/components/home/actions-panel"
import { CvSummary } from "@/components/home/cv-summary"
import type { HomeTalent, HomeUser } from "@/components/home/home-data"
import { OverallPanel } from "@/components/home/overall-panel"
import { NotificationList } from "@/components/notifications/notification-list"
import { useI18n } from "@/i18n/provider"
import { firstName } from "@/lib/format"
import { useStore } from "@/lib/store"
import { useRoleGuard } from "@/lib/use-role-guard"

// A job seeker's Home: Overall on the left, their CV and notifications in the middle, Actions on the right.
export function HomeView() {
  const { t, dir } = useI18n()
  const user = useRoleGuard(["SEEKER"]) as HomeUser | null
  const talent = useStore((s) => (user ? s.talents.find((x) => x.userId === user.id) : undefined)) as HomeTalent | undefined
  if (!user) return null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("home.greeting", { name: firstName(user.name) })}</h1>

      {/* The panels keep their physical sides in every language (stats left, actions right); text inside follows the language */}
      <div dir="ltr" className="grid grid-cols-[13rem_minmax(0,1fr)_16rem] items-start gap-6 xl:grid-cols-[15rem_minmax(0,1fr)_18rem]">
        <div dir={dir} className="sticky top-32">
          <OverallPanel user={user} talent={talent ?? null} />
        </div>
        <div dir={dir} className="min-w-0 space-y-6">
          <CvSummary user={user} talent={talent ?? null} />
          {/* New jobs that match the job seeker (the same list as the bell in the header) */}
          <section className="overflow-hidden rounded-xl border bg-card">
            <NotificationList section className="max-h-[32rem]" />
          </section>
        </div>
        <div dir={dir} className="sticky top-32">
          <ActionsPanel user={user} talent={talent ?? null} />
        </div>
      </div>
    </div>
  )
}
