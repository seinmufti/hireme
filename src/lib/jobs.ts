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
