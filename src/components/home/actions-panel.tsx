"use client"

import { useState } from "react"
import Link from "next/link"
import { BriefcaseIcon, EyeIcon, FileTextIcon, SendIcon, SettingsIcon } from "lucide-react"
import { BRAND_RED } from "@/components/brand-name"
import { useT } from "@/i18n/provider"
import { useStore } from "@/lib/store"
import { useProfileViewers, ViewersDialog } from "./viewers-dialog"

/** Right sidebar: quick actions. */
export function ActionsPanel() {
  const t = useT()
  const me = useStore((s) => s.currentUserId) ?? ""
  const viewers = useProfileViewers(me)
  const [viewersOpen, setViewersOpen] = useState(false)

  // Editing is from each part of the CV (its Edit button), so not here
  const actions = [
    { href: "/profile/cv", icon: FileTextIcon, label: t("home.previewCv") },
    { href: "/jobs", icon: BriefcaseIcon, label: t("nav.jobs") },
    { href: "/jobs/applied", icon: SendIcon, label: t("nav.applications") },
    { href: "/account", icon: SettingsIcon, label: t("account.title") },
  ]

  return (
    <aside className="space-y-4">
      <section className="overflow-hidden rounded-xl border bg-card">
        {/* The header filled with the brand red */}
        <h3 className="px-4 py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: BRAND_RED }}>
          {t("home.actions")}
        </h3>
        <ul className="p-1.5">
          {actions.map((a) => (
            <li key={a.href}>
              <Link href={a.href} className={"flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-sm text-blue-700 hover:bg-muted"}>
                <a.icon className="mt-0.5 size-4 shrink-0" />
                <span className="flex-1 leading-snug underline underline-offset-4">{a.label}</span>
              </Link>
            </li>
          ))}
          {/* Who opened your CV, in a window */}
          <li>
            <button type="button" onClick={() => setViewersOpen(true)} className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-start text-sm text-blue-700 hover:bg-muted">
              <EyeIcon className="mt-0.5 size-4 shrink-0" />
              <span className="flex-1 leading-snug underline underline-offset-4">{t("home.viewers")}</span>
              {viewers.length > 0 && <span className="rounded-full bg-blue-50 px-2 text-xs font-medium text-blue-800 tabular-nums">{viewers.length}</span>}
            </button>
          </li>
        </ul>
      </section>
      <ViewersDialog seekerId={me} open={viewersOpen} onOpenChange={setViewersOpen} />
    </aside>
  )
}
