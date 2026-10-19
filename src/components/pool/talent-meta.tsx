import { BriefcaseIcon, CakeIcon, GraduationCapIcon, LanguagesIcon, UserIcon } from "lucide-react"
import { formatDuration, formatJobPeriod, formatMonthYear } from "@/lib/format"
import { LANGUAGE_LEVELS } from "@/lib/options"
import { cn } from "@/lib/utils"
import type { Certification, Degree, Experience, LanguageSkill } from "@/lib/types"

type FactsInput = {
  gender: string
  age: number | null
  education: string
  languages: LanguageSkill[]
  totalMonths: number
}

const levelLabel = (v: string) => LANGUAGE_LEVELS.find((l) => l.value === v)?.label ?? v

/** Language on the left, speaking and reading levels on the right. */
export function LanguageList({ languages }: { languages: LanguageSkill[] }) {
  if (!languages.length) return <p className="text-sm text-muted-foreground">No languages listed.</p>
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-muted-foreground">
          <th className="pb-1.5 font-medium">Language</th>
          <th className="pb-1.5 font-medium">Speaking</th>
          <th className="pb-1.5 font-medium">Reading</th>
        </tr>
      </thead>
      <tbody>
        {languages.map((l) => (
          <tr key={l.language} className="border-t">
            <td className="py-1.5 font-medium">{l.language}</td>
            <td className="py-1.5">{levelLabel(l.speaking)}</td>
            <td className="py-1.5">{levelLabel(l.reading)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function portfolioFacts(t: FactsInput) {
  return [
    { icon: BriefcaseIcon, label: "Experience", value: t.totalMonths ? formatDuration(t.totalMonths) : "No experience yet" },
    { icon: CakeIcon, label: "Age", value: t.age === null ? "—" : `${t.age} years old` },
    { icon: UserIcon, label: "Gender", value: t.gender || "—" },
    { icon: GraduationCapIcon, label: "Education", value: t.education || "—" },
    { icon: LanguagesIcon, label: "Languages", value: t.languages.map((l) => l.language).join(", ") || "—" },
  ]
}

/** The most recent job (first in the list) as a one-line summary. */
export const latestJob = (experiences: Experience[]) =>
  experiences[0] ? `${experiences[0].title} at ${experiences[0].employer}` : "No work experience yet"

export function ExperienceList({ experiences, limit }: { experiences: Experience[]; limit?: number }) {
  const shown = limit ? experiences.slice(0, limit) : experiences
  if (!experiences.length) return <p className="text-sm text-muted-foreground">No previous jobs listed.</p>
  return (
    <ol className="space-y-2">
      {shown.map((e) => (
        <li key={e.id} className="min-w-0 text-sm">
          <div className="truncate">
            <span className="font-medium">{e.title}</span>
            <span className="text-muted-foreground"> · {e.employer}</span>
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {[e.category, e.contractType, formatJobPeriod(e)].filter(Boolean).join(" · ")}
          </div>
        </li>
      ))}
      {limit && experiences.length > limit && (
        <li className="text-xs text-muted-foreground">+{experiences.length - limit} more</li>
      )}
    </ol>
  )
}

/** "Period: 2015 – 2019" / "Period: 2022 – expected 2026"; parts not filled in yet are left out. */
function degreePeriod(d: Degree) {
  if (!d.status) return ""
  const years = [d.startYear, d.endYear && (d.status === "Studying" ? `expected ${d.endYear}` : d.endYear)].filter(Boolean).join(" – ")
  return years ? `Period: ${years}` : ""
}

export function DegreeList({ degrees }: { degrees: Degree[] }) {
  if (!degrees.length) return <p className="text-sm text-muted-foreground">No degrees listed.</p>
  const missing = (value: string, text: string) => <span className={cn(!value && "italic")}>{value || text}</span>
  return (
    <ol className="space-y-3">
      {degrees.map((d) => (
        <li key={d.id} className="min-w-0 text-sm">
          {/* Every field always shows; ones not filled in yet say so */}
          <div className={cn("truncate", d.name ? "font-medium" : "text-muted-foreground")}>{d.name || "Degree name not added"}</div>
          <div className="truncate text-xs text-muted-foreground">
            {missing(d.institution, "Institution not added")}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {missing(d.level, "Level not added")}
            {" · "}
            {missing(d.field, "Field not added")}
            {" · "}
            {missing(degreePeriod(d), "Status and years not added")}
          </div>
        </li>
      ))}
    </ol>
  )
}

export function CertificationList({ certifications }: { certifications: Certification[] }) {
  if (!certifications.length) return <p className="text-sm text-muted-foreground">No certifications listed.</p>
  return (
    <ol className="space-y-2">
      {certifications.map((c) => (
        <li key={c.id} className="min-w-0 text-sm">
          <div className="truncate font-medium">{c.title}</div>
          <div className="truncate text-xs text-muted-foreground">
            {[c.institution, c.issued && `Issued ${formatMonthYear(c.issued)}`].filter(Boolean).join(" · ")}
          </div>
        </li>
      ))}
    </ol>
  )
}
