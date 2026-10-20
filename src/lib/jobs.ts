import type { Job, JobLocation, User } from "@/lib/types"

// Job postings: where a job is, and keyword search for jobs and companies.

// Cities a job can be in. The Kurdistan Region first, then the rest of Iraq.
export const JOB_CITIES = [
  "Erbil",
  "Sulaymaniyah",
  "Duhok",
  "Halabja",
  "Zakho",
  "Soran",
  "Ranya",
  "Kalar",
  "Kirkuk",
  "Baghdad",
  "Basra",
  "Mosul",
  "Najaf",
  "Karbala",
  "Hillah",
  "Nasiriyah",
  "Amarah",
  "Kut",
  "Diwaniyah",
  "Samawah",
  "Ramadi",
  "Fallujah",
  "Baqubah",
  "Tikrit",
]

/** Today as "YYYY-MM-DD" in local time, to compare with deadlines. */
export const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** The last day to apply has passed. */
export const deadlinePassed = (job: Pick<Job, "deadline">) => !!job.deadline && job.deadline < today()

/** Days left to apply: 0 on the last day, negative once it has passed, null without a deadline. */
export function daysLeft(job: Pick<Job, "deadline">) {
  if (!job.deadline) return null
  const [y, m, d] = job.deadline.split("-").map(Number)
  const [ty, tm, td] = today().split("-").map(Number)
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(ty, tm - 1, td)) / 86_400_000)
}

/** Open and before its deadline: shows in search and matching, and takes applications. */
export const takesApplications = (job: Pick<Job, "open" | "deadline">) => job.open && !deadlinePassed(job)

export type WorkplaceKind = "city" | "remote" | "international"

export const WORKPLACES: { value: WorkplaceKind; label: string }[] = [
  { value: "city", label: "On site in Iraq" },
  { value: "remote", label: "Remote" },
  { value: "international", label: "International" },
]

export const workplaceOf = (l: JobLocation): WorkplaceKind => (l.remote ? "remote" : l.international ? "international" : "city")

/** "Erbil", "Remote" or "International" */
export const locationLabel = (l: JobLocation) => (l.remote ? "Remote" : l.international ? "International" : l.iraqCity || "Iraq")

/** Location filter value: the city, "Remote" or "International" (same as the label). */
export const locationValue = locationLabel

/**
 * Keyword search over everything a job says about itself, so "sales" finds every sales job:
 * title, category, company, skills, description and location. Every word typed must appear.
 */
export function jobMatchesQuery(job: Job, query: string) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return true
  const text = [job.title, job.category, job.company, job.contractType, locationLabel(job.location), job.description, ...job.skills]
    .join(" ")
    .toLowerCase()
  return words.every((w) => text.includes(w))
}

/** Company search (an employer account): name, contact person, city or what it does. Every word typed must appear. */
export function companyMatchesQuery(c: User, query: string) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const text = [c.company, c.name, c.title, c.city, c.bio].join(" ").toLowerCase()
  return words.every((w) => text.includes(w))
}
