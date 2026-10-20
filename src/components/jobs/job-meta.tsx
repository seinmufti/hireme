"use client"

import { BanknoteIcon, BriefcaseIcon, Building2Icon, CalendarClockIcon, ClockIcon, GlobeIcon, LaptopIcon, MapPinIcon, TagIcon } from "lucide-react"
import { useExactDate, useI18n, useLocationLabel, useTimeAgo } from "@/i18n/provider"
import { daysLeft } from "@/lib/jobs"
import { formatMoney, formatRange } from "@/lib/salary"
import type { Job, Salary } from "@/lib/types"
import { cn } from "@/lib/utils"

export type JobFact = "company" | "location" | "salary" | "contract" | "category" | "posted" | "deadline"

/** "$1,500–2,200 a month", "From 400,000 IQD a month", "Up to $6,000 a month"; "" when there's no salary. */
export function useSalaryLabel() {
  const { t } = useI18n()
  return (s: Salary | null | undefined) => {
    if (!s || (!s.min && !s.max)) return ""
    const range = formatRange(s)
    if (range) return t("jobs.salaryMonthly", { amount: range })
    return s.min ? t("jobs.salaryFrom", { amount: formatMoney(s.min, s.currency) }) : t("jobs.salaryUpTo", { amount: formatMoney(s.max!, s.currency) })
  }
}

/** Company, location, contract type, category and when it was posted, in the current language. */
/** "Apply by 20 Nov 2026 · 31 days left", "Last day to apply: today" or "Applications closed". */
export function useDeadlineLabel() {
  const { t, locale } = useI18n()
  return (job: Job) => {
    const left = daysLeft(job)
    if (left === null) return ""
    if (left < 0) return t("jobs.deadlinePassed")
    if (left === 0) return t("jobs.lastDay")
    const [y, m, d] = job.deadline.split("-").map(Number)
    const date = new Date(y, m - 1, d).toLocaleDateString(locale === "en" ? "en-GB" : locale, { day: "numeric", month: "short", year: "numeric" })
    return `${t("jobs.applyBy", { date })} · ${left === 1 ? t("jobs.dayLeft") : t("jobs.daysLeft", { count: left })}`
  }
}

export function useJobFacts() {
  const { t } = useI18n()
  const deadline = useDeadlineLabel()
  const timeAgo = useTimeAgo()
  const locationLabel = useLocationLabel()
  const salary = useSalaryLabel()
  const exact = useExactDate()
  return (job: Job): { key: JobFact; icon: typeof ClockIcon; label: string; value: string; hint?: string }[] => [
    { key: "company" as JobFact, icon: Building2Icon, label: t("jobs.factCompany"), value: job.company },
    {
      key: "location" as JobFact,
      icon: job.location.remote ? LaptopIcon : job.location.international ? GlobeIcon : MapPinIcon,
      label: t("jobs.factLocation"),
      value: locationLabel(job.location),
    },
    { key: "salary" as JobFact, icon: BanknoteIcon, label: t("jobs.factSalary"), value: salary(job.salary) },
    { key: "contract" as JobFact, icon: BriefcaseIcon, label: t("jobs.factContract"), value: job.contractType },
    { key: "category" as JobFact, icon: TagIcon, label: t("jobs.factCategory"), value: job.category },
    { key: "posted" as JobFact, icon: ClockIcon, label: t("jobs.factPosted"), value: t("jobs.posted", { time: timeAgo(job.createdAt) }), hint: exact(job.createdAt) },
    { key: "deadline" as JobFact, icon: CalendarClockIcon, label: t("jobs.factDeadline"), value: deadline(job) },
  ].filter((f) => f.value)
}

/** The job's skills as chips; the ones the job seeker has are highlighted. */
export function SkillChips({ skills, have = [], limit, className }: { skills: string[]; have?: string[]; limit?: number; className?: string }) {
  if (!skills.length) return null
  const mine = new Set(have.map((s) => s.toLowerCase()))
  const shown = limit ? skills.slice(0, limit) : skills
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {shown.map((s) => (
        <li
          key={s}
          className={cn(
            "rounded-full border px-2 py-0.5 text-xs",
            mine.has(s.toLowerCase()) ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "bg-muted/50 text-foreground"
          )}
        >
          {s}
        </li>
      ))}
      {limit && skills.length > limit && <li className="px-1 py-0.5 text-xs text-muted-foreground">+{skills.length - limit}</li>}
    </ul>
  )
}

/** The description as written: lines starting with "-" or "•" become bullet points, the rest paragraphs. */
export function JobDescription({ text }: { text: string }) {
  const blocks: { bullets: boolean; lines: string[] }[] = []
  for (const raw of text.split("\n")) {
    const line = raw.trim()
    if (!line) {
      blocks.push({ bullets: false, lines: [] })
      continue
    }
    const bullet = /^[-•*]\s+/.test(line)
    const last = blocks[blocks.length - 1]
    const content = line.replace(/^[-•*]\s+/, "")
    if (last && last.bullets === bullet && last.lines.length) last.lines.push(content)
    else blocks.push({ bullets: bullet, lines: [content] })
  }
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {blocks
        .filter((b) => b.lines.length)
        .map((b, i) =>
          b.bullets ? (
            <ul key={i} className="list-disc space-y-1 ps-5">
              {b.lines.map((l, j) => (
                <li key={j}>{l}</li>
              ))}
            </ul>
          ) : (
            <p key={i}>{b.lines.join(" ")}</p>
          )
        )}
    </div>
  )
}
