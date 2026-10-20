"use client"

import Link from "next/link"
import { BriefcaseIcon, GraduationCapIcon, LanguagesIcon, MapPinIcon } from "lucide-react"
import { useI18n } from "@/i18n/provider"
import { highestEducation, totalMonths } from "@/lib/format"
import { countryName, editCvAt, flagOf, type HomeTalent, type HomeUser } from "./home-data"

/** Left sidebar: the job seeker's totals at a glance. */
export function OverallPanel({ user, talent }: { user: HomeUser; talent: HomeTalent | null }) {
  const { t, locale } = useI18n()
  const months = talent ? totalMonths(talent.experiences) : 0
  const years = Math.floor(months / 12)
  const rest = months % 12
  const duration = [years && `${years} ${t("home.yearsShort")}`, rest && `${rest} ${t("home.monthsShort")}`].filter(Boolean).join(" ")
  const languages = talent?.languages.filter((l) => l.language) ?? []
  const country = user.country || (user.city ? "IQ" : "")
  const education = talent ? highestEducation(talent.degrees) : ""

  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="mb-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("home.overall")}</h2>
      <dl className="space-y-5 text-sm">
        <Stat icon={BriefcaseIcon} label={t("home.totalExperience")}>
          {months ? <span className="text-2xl font-semibold tracking-tight">{duration}</span> : <Missing href={editCvAt("work")}>{t("home.noExperience")}</Missing>}
        </Stat>

        <Stat icon={LanguagesIcon} label={t("home.languages")}>
          {languages.length ? (
            <ul className="space-y-1">
              {languages.map((l) => (
                <li key={l.language} className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-medium">{l.language}</span>
                  <span dir="ltr" className="shrink-0 text-xs text-muted-foreground">{l.speaking}</span>
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
