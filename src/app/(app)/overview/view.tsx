"use client"

import { ActionsPanel } from "@/components/home/actions-panel"
import { SeekerProfile } from "@/components/profile/seeker-profile"
import type { HomeTalent, HomeUser } from "@/components/home/home-data"
import { OverallPanel } from "@/components/home/overall-panel"
import { NotificationList } from "@/components/notifications/notification-list"
import { useI18n } from "@/i18n/provider"
import { useStore } from "@/lib/store"
import { useRoleGuard } from "@/lib/use-role-guard"

// A job seeker's Profile tab: Overall on the left, their whole CV (viewed and edited here) and notifications in the middle, Actions on the right.
export function OverviewView() {
  const { dir } = useI18n()
  const account = useRoleGuard(["SEEKER"])
  const user = account as HomeUser | null
  const talent = useStore((s) => (user ? s.talents.find((x) => x.userId === user.id) : undefined)) as HomeTalent | undefined
  if (!user || !account) return null

  return (
    <div className="space-y-6">
      {/* The panels keep their physical sides in every language (stats left, actions right); text inside follows the language */}
      <div dir="ltr" className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[13rem_minmax(0,1fr)_16rem] xl:grid-cols-[15rem_minmax(0,1fr)_18rem]">
        {/* Phones and tablets: one column, your CV first, then the stats, then the actions */}
        <div dir={dir} className="order-2 lg:sticky lg:top-20 lg:order-none">
          <OverallPanel user={user} talent={talent ?? null} />
        </div>
        <div dir={dir} className="order-1 min-w-0 space-y-6 lg:order-none">
          {/* The whole CV: one card while reading it, a card per section while editing. Keyed so switching accounts resets the form */}
          <SeekerProfile key={account.id} user={account} embedded />
          {/* New jobs that match the job seeker (the same list as the bell in the header) */}
          <section className="overflow-hidden rounded-xl border bg-card">
            <NotificationList section className="max-h-[32rem]" />
          </section>
        </div>
        <div dir={dir} className="order-3 lg:sticky lg:top-20 lg:order-none">
          <ActionsPanel />
        </div>
      </div>
    </div>
  )
}
