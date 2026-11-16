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
      <h2 className="text-lg font-semibold tracking-tight">{t("home.companiesTitle")}</h2>
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
            <BrandName />
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

/**
 * HireMe's social pages. TODO: the real addresses; until then each link is "#" (the icons show, but go nowhere).
 */
const SOCIALS: { name: string; href: string; path: string }[] = [
  {
    name: "LinkedIn",
    href: "#",
    path: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z M2 9h4v12H2z M4 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z",
  },
  {
    name: "Instagram",
    href: "#",
    path: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z M17.5 6.5h.01",
  },
  { name: "Facebook", href: "#", path: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" },
  { name: "X", href: "#", path: "M4 4l11.733 16h4.267l-11.733-16z M4 20l6.768-6.768 M13.228 10.772L20 4" },
  {
    name: "TikTok",
    href: "#",
    path: "M21 7.917v4.034a9.948 9.948 0 0 1-5-1.951v4.5a6.5 6.5 0 1 1-8-6.326v4.326a2.5 2.5 0 1 0 4 2v-11.5h4.083a6.005 6.005 0 0 0 4.917 4.917z",
  },
  {
    name: "WhatsApp",
    href: "#",
    path: "M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21 M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1",
  },
]

/** The end of Home: HireMe's social pages, then the copyright line. */
export function ContactUs() {
  const t = useT()
  return (
    <footer className="space-y-6 rounded-2xl border bg-card p-6 text-center sm:p-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight">{t("home.contactTitle")}</h2>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">{t("home.contactText")}</p>
      </div>
      <ul className="flex flex-wrap justify-center gap-3">
        {SOCIALS.map((s) => (
          <li key={s.name}>
            <a
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.name}
              title={s.name}
              className="flex size-11 items-center justify-center rounded-full bg-brand-soft text-primary transition hover:bg-primary hover:text-primary-foreground"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d={s.path} />
              </svg>
            </a>
          </li>
        ))}
      </ul>
      <p className="border-t pt-4 text-xs text-muted-foreground">{t("home.rights", { year: new Date().getFullYear() })}</p>
    </footer>
  )
}
