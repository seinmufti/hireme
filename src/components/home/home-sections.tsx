"use client"

import Link from "next/link"
import { BellRingIcon, FileTextIcon, HandshakeIcon, SendIcon, TargetIcon } from "lucide-react"
import { BrandName } from "@/components/brand-name"
import { CompanyLogo } from "@/components/company-logo"
import { useT } from "@/i18n/provider"
import { useStore } from "@/lib/store"

/** The companies hiring on HireMe, as square tiles in a row that keeps moving (stops while the pointer is on it). Each opens its page. */
export function CompaniesCarousel() {
  const t = useT()
  const users = useStore((s) => s.users)
  const companies = users.filter((u) => u.role === "EMPLOYER")
  if (companies.length === 0) return null

  // Enough companies to fill a wide screen (repeated when there are few), then all of that twice, so the row loops
  // without a gap
  const half = Array.from({ length: Math.max(1, Math.ceil(12 / companies.length)) }, () => companies).flat()
  const row = [...half, ...half]
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{t("home.companiesTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("home.companiesSubtitle")}</p>
      </div>
      <div className="group relative overflow-hidden rounded-xl border bg-card py-4 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
        <ul className="animate-marquee flex w-max gap-3 group-hover:[animation-play-state:paused] rtl:[animation-direction:reverse]">
          {row.map((c, i) => (
            <li key={`${c.id}-${i}`} aria-hidden={i >= companies.length || undefined}>
              <Link
                href={`/companies/${c.id}`}
                tabIndex={i >= companies.length ? -1 : undefined}
                className="flex size-36 flex-col items-center justify-center gap-2 rounded-xl border bg-background p-3 text-center transition hover:border-primary/30 hover:shadow-sm"
              >
                <CompanyLogo employer={c} size={48} />
                <span className="w-full">
                  <span className="line-clamp-2 text-sm leading-tight font-medium">{c.company || c.name}</span>
                  {c.city && <span className="block truncate text-xs text-muted-foreground">{c.city}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** Who we are and what HireMe does, at the end of Home. */
export function AboutUs() {
  const t = useT()
  const points = [
    { icon: FileTextIcon, title: t("home.aboutCvTitle"), text: t("home.aboutCvText") },
    { icon: TargetIcon, title: t("home.aboutMatchTitle"), text: t("home.aboutMatchText") },
    { icon: SendIcon, title: t("home.aboutApplyTitle"), text: t("home.aboutApplyText") },
    { icon: BellRingIcon, title: t("home.aboutNotifyTitle"), text: t("home.aboutNotifyText") },
  ]
  return (
    <section className="relative overflow-hidden rounded-2xl border bg-card p-6 sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="space-y-3">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-primary">
            <HandshakeIcon className="size-3.5" /> {t("home.aboutBadge")}
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("home.aboutTitle")} <BrandName />
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("home.aboutText")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("home.aboutMission")}</p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {points.map((p) => (
            <li key={p.title} className="space-y-1.5 rounded-xl border bg-background p-4">
              <span className="flex size-9 items-center justify-center rounded-lg bg-brand-soft text-primary">
                <p.icon className="size-4" />
              </span>
              <p className="text-sm font-medium">{p.title}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{p.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
