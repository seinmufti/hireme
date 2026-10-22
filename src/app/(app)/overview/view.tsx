"use client"

import { ActionsPanel } from "@/components/home/actions-panel"
import { CvContents, SeekerProfile } from "@/components/profile/seeker-profile"
import type { HomeTalent, HomeUser } from "@/components/home/home-data"
import { OverallPanel } from "@/components/home/overall-panel"
import { useI18n } from "@/i18n/provider"
import { useStore } from "@/lib/store"
import { useRoleGuard } from "@/lib/use-role-guard"

// A job seeker's Profile tab: Overall on the left, their whole CV (viewed and edited here) in the middle, Actions on the right.
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
        {/* Phones and tablets: one column, your CV first (its actions under the name), then the stats */}
        {/* Wide screens: Overall and the CV's sections stay in view, and scroll on their own when taller than the window */}
        <div dir={dir} className="no-scrollbar order-2 space-y-4 lg:sticky lg:top-20 lg:order-none lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto">
          <OverallPanel user={user} talent={talent ?? null} />
          <div className="hidden lg:block">
            <CvContents />
          </div>
        </div>
        <div dir={dir} className="order-1 min-w-0 space-y-6 lg:order-none">
          {/* The whole CV: one card while reading it, a card per section while editing. Keyed so switching accounts resets the form */}
          <SeekerProfile key={account.id} user={account} embedded />
        </div>
        {/* Wide screens only: phones have these actions as buttons under the name (see SeekerProfile) */}
        <div dir={dir} className="hidden lg:sticky lg:top-20 lg:block">
          <ActionsPanel />
        </div>
      </div>
    </div>
  )
}
