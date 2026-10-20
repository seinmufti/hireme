"use client"

import Link from "next/link"
import { BriefcaseIcon, Building2Icon, ChevronRightIcon, MessageSquareTextIcon, PencilIcon } from "lucide-react"
import { NotificationList } from "@/components/notifications/notification-list"
import { useT } from "@/i18n/provider"
import { unreadCountFor, useStore } from "@/lib/store"
import type { HomeTalent, HomeUser } from "./home-data"
import { WorkPreferenceCard } from "./work-preference"

/** Right sidebar: notifications, quick actions and the type of work the job seeker wants. */
export function ActionsPanel({ user, talent }: { user: HomeUser; talent: HomeTalent | null }) {
  const t = useT()
  const unread = useStore((s) => unreadCountFor(s, user.id))

  const actions = [
    { href: "/jobs", icon: BriefcaseIcon, label: t("home.findJobs") },
    { href: "/inbox", icon: MessageSquareTextIcon, label: t("home.openInbox"), note: unread ? t("home.unread", { count: unread }) : "" },
    { href: "/companies", icon: Building2Icon, label: t("home.browseCompanies") },
    { href: "/profile", icon: PencilIcon, label: t("home.editCv") },
  ]

  return (
    <aside className="space-y-4">
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("home.actions")}</h2>

      {/* New jobs that match the job seeker (the same list as the bell in the header) */}
      <section className="overflow-hidden rounded-xl border bg-card">
        <NotificationList className="max-h-80" />
      </section>

      <section className="rounded-xl border bg-card p-1.5">
        <h3 className="px-2.5 pt-2 pb-1 text-sm font-semibold">{t("home.quickActions")}</h3>
        <ul>
          {actions.map((a) => (
            <li key={a.href}>
              <Link href={a.href} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm hover:bg-muted">
                <a.icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{a.label}</span>
                {a.note && (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] leading-none font-semibold text-primary-foreground">
                    {a.note}
                  </span>
                )}
                <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground rtl:rotate-180" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <WorkPreferenceCard user={user} talent={talent} />
    </aside>
  )
}
