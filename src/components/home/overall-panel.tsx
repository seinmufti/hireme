"use client"

import Link from "next/link"
import { BriefcaseIcon, GraduationCapIcon, LanguagesIcon, MapPinIcon } from "lucide-react"
import { useI18n } from "@/i18n/provider"
import { highestEducation, jobMonths, totalMonths } from "@/lib/format"
import { countryName, editCvAt, flagOf, type HomeTalent, type HomeUser } from "./home-data"

/** Left sidebar: the job seeker's totals at a glance. */
export function OverallPanel({ user, talent }: { user: HomeUser; talent: HomeTalent | null }) {
  const { t, locale } = useI18n()
  const months = talent ? totalMonths(talent.experiences) : 0
  const span = (m: number) =>
    [Math.floor(m / 12) && `${Math.floor(m / 12)} ${Math.floor(m / 12) === 1 ? t("home.yearShort") : t("home.yearsShort")}`, m % 12 && `${m % 12} ${t("home.monthsShort")}`].filter(Boolean).join(" ")
  const duration = span(months)
  // The total split by field (each job's category), most experience first
  const byField = [
    ...(talent?.experiences ?? []).reduce((all, e) => {
      const field = e.category?.trim()
      return field ? all.set(field, (all.get(field) ?? 0) + jobMonths(e)) : all
    }, new Map<string, number>()),
  ]
    .filter(([, m]) => m > 0)
    .sort((a, b) => b[1] - a[1])
  const languages = talent?.languages.filter((l) => l.language) ?? []
  const country = user.country || (user.city ? "IQ" : "")
  const education = talent ? highestEducation(talent.degrees) : ""

  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="mb-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("home.overall")}</h2>
      <dl className="space-y-5 text-sm">
        <Stat icon={BriefcaseIcon} label={t("home.totalExperience")}>
          {months ? (
            <>
              <span className="text-2xl font-semibold tracking-tight">{duration}</span>
              {byField.length > 0 && (
                // Two fields per row: each name in full, the time spent in it below
                <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
                  {byField.map(([field, m]) => (
                    <li key={field} className="leading-snug">
                      <p className="font-medium">{field}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">{span(m)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <Missing href={editCvAt("work")}>{t("home.noExperience")}</Missing>
          )}
        </Stat>

        <Stat icon={LanguagesIcon} label={t("home.languages")}>
          {languages.length ? (
            <ul className="space-y-1">
              {languages.map((l) => (
                // Just the languages; their levels are on the CV
                <li key={l.language} className="truncate font-medium">
                  {l.language}
                </li>
              ))}
            </ul>
          ) : (
            <Missing href={editCvAt("languages")}>{t("home.noLanguages")}</Missing>
          )}
        </Stat>

        <Stat icon={MapPinIcon} label={t("home.location")}>
          {user.city || country ? (
            <span className="font-medium">
              {country && <span className="me-1.5">{flagOf(country)}</span>}
              {[user.city, country && countryName(country, locale)].filter(Boolean).join(", ")}
            </span>
          ) : (
            <Missing href={editCvAt("personal")}>{t("home.noLocation")}</Missing>
          )}
        </Stat>

        <Stat icon={GraduationCapIcon} label={t("home.education")}>
          {education ? <span className="font-medium">{education}</span> : <Missing href={editCvAt("education")}>{t("common.noneYet")}</Missing>}
        </Stat>
      </dl>
    </section>
  )
}

function Stat({ icon: Icon, label, children }: { icon: typeof BriefcaseIcon; label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  )
}

/** Something not filled in yet: opens the CV form where it goes. */
const Missing = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="text-primary hover:underline">
    {children}
  </Link>
)
