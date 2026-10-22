"use client"

import Link from "next/link"
import { FileTextIcon, PencilIcon } from "lucide-react"
import { BRAND_RED } from "@/components/brand-name"
import { useT } from "@/i18n/provider"

/** Right sidebar: quick actions. */
export function ActionsPanel() {
  const t = useT()

  const actions = [
    // Edit CV is only here on Home
    { href: "/overview?edit=1", icon: PencilIcon, label: t("common.edit") },
    { href: "/profile/cv", icon: FileTextIcon, label: t("home.previewCv") },
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
                <span className="flex-1 leading-snug">{a.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  )
}
