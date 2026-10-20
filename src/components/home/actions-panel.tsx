"use client"

import { useT } from "@/i18n/provider"
import type { HomeTalent, HomeUser } from "./home-data"
import { WorkPreferenceCard } from "./work-preference"

/** Right sidebar: the type of work the job seeker wants. */
export function ActionsPanel({ user, talent }: { user: HomeUser; talent: HomeTalent | null }) {
  const t = useT()

  return (
    <aside className="space-y-4">
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("home.actions")}</h2>

      <WorkPreferenceCard user={user} talent={talent} />
    </aside>
  )
}
