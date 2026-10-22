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
      <div dir="ltr" className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[14rem_minmax(0,1fr)_16rem] xl:grid-cols-[17rem_minmax(0,1fr)_16rem]">
        {/* Phones and tablets: one column, your CV first (its actions under the name), then the stats */}
        {/* Wide screens: Overall stays in view (and scrolls on its own if taller than the window) */}
        <div dir={dir} className="no-scrollbar order-2 lg:sticky lg:top-[calc(5.5rem+1px)] lg:order-none lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:overscroll-y-contain">
          <OverallPanel user={user} talent={talent ?? null} />
        </div>
        <div dir={dir} className="order-1 min-w-0 space-y-6 lg:order-none">
          {/* The whole CV: one card while reading it, a card per section while editing. Keyed so switching accounts resets the form */}
          <SeekerProfile key={account.id} user={account} embedded />
        </div>
        {/* Wide screens only: the CV's sections to jump to, then the actions (phones have them as buttons
            under the name, see SeekerProfile) */}
        <div dir={dir} className="no-scrollbar hidden space-y-4 lg:sticky lg:top-[calc(5.5rem+1px)] lg:block lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:overscroll-y-contain">
          <CvContents />
          <ActionsPanel />
        </div>
      </div>
    </div>
  )
}
