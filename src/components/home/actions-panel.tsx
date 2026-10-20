"use client"

import Link from "next/link"
import { ChevronRightIcon, FileTextIcon, PencilIcon } from "lucide-react"
import { useT } from "@/i18n/provider"

/** Right sidebar: quick actions. */
export function ActionsPanel() {
  const t = useT()

  const actions = [
    // Edit CV is only here on Home
    { href: "/profile?edit=1", icon: PencilIcon, label: t("home.editCv") },
    { href: "/profile/cv", icon: FileTextIcon, label: t("home.previewCv") },
  ]

  return (
    <aside className="space-y-4">
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("home.actions")}</h2>

      <section className="rounded-xl border bg-card p-1.5">
        <h3 className="px-2.5 pt-2 pb-1 text-sm font-semibold">{t("home.quickActions")}</h3>
        <ul>
          {actions.map((a) => (
            <li key={a.href}>
              <Link href={a.href} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm hover:bg-muted">
                <a.icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{a.label}</span>
                <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground rtl:rotate-180" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  )
}
