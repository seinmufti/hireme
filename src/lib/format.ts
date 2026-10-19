import { EDUCATION } from "@/lib/options"
import type { Degree, Experience } from "@/lib/types"

export const firstName = (name: string) => name.split(" ")[0]

export function ageFrom(dateOfBirth: string, now = new Date()) {
  const dob = new Date(dateOfBirth)
  if (Number.isNaN(dob.getTime())) return null
  const age = now.getFullYear() - dob.getFullYear()
  const beforeBirthday = now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())
  return beforeBirthday ? age - 1 : age
}

const MONTH_VALUE = /^\d{4}-\d{2}$/
const monthIndex = (value: string) => {
  const [y, m] = value.split("-").map(Number)
  return y * 12 + m - 1
}

/** Months between a job's start and end (or today, while it's current). 0 until the dates are complete. */
export function jobMonths(e: Pick<Experience, "start" | "end" | "current">, now = new Date()) {
  if (!MONTH_VALUE.test(e.start ?? "")) return 0
  const end = e.current ? now.getFullYear() * 12 + now.getMonth() : MONTH_VALUE.test(e.end ?? "") ? monthIndex(e.end) : null
  return end === null ? 0 : Math.max(0, end - monthIndex(e.start))
}

export const totalMonths = (experiences: Experience[]) => experiences.reduce((sum, e) => sum + jobMonths(e), 0)

/** "March 2022 – September 2024" / "March 2022 – Present"; "" until the start is known. */
export function formatJobPeriod(e: Pick<Experience, "start" | "end" | "current">) {
  if (!MONTH_VALUE.test(e.start ?? "")) return ""
  const from = formatMonthYear(e.start)
  if (e.current) return `${from} – Present`
  return MONTH_VALUE.test(e.end ?? "") ? `${from} – ${formatMonthYear(e.end)}` : from
}

export function formatDuration(months: number) {
  const y = Math.floor(months / 12)
  const m = months % 12
  const parts = [y && `${y} yr${y === 1 ? "" : "s"}`, m && `${m} mo`].filter(Boolean)
  return parts.length ? parts.join(" ") : "0 mo"
}

export function timeAgo(date: Date | string) {
  const s = Math.round((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return "just now"
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

// Iraqi phone numbers are stored and shown as "+964 750 000 0103"
export const PHONE_PATTERN = /^\+964 \d{3} \d{3} \d{4}$/

/** Formats whatever was typed or pasted (0750…, 964750…, +964 750…) as "+964 750 000 0103". */
export function formatIraqiPhone(raw: string) {
  let digits = raw.replace(/\D/g, "")
  if (digits.startsWith("964")) digits = digits.slice(3)
  digits = digits.replace(/^0+/, "").slice(0, 10)
  if (!digits) return ""
  const groups = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10)].filter(Boolean)
  return `+964 ${groups.join(" ")}`
}

/** The highest degree level someone holds ("" if none), e.g. for Pool cards and the Education filter. */
export function highestEducation(degrees: Degree[]) {
  return degrees.reduce((best, d) => (EDUCATION.indexOf(d.level) > EDUCATION.indexOf(best) ? d.level : best), "")
}

/** "2023-06" -> "June 2023" */
export function formatMonthYear(value: string) {
  const [y, m] = value.split("-").map(Number)
  if (!y || !m) return ""
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
}
