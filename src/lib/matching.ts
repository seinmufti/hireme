import type { Experience, Job } from "@/lib/types"

// Which jobs suit a job seeker, used for "jobs matching your profile" and for notifications.
//
// Skills (hardSkills/softSkills) and work preferences (workPreference) come from the CV builder.
// Portfolios saved before those existed don't have them, so every one of them is optional here.

export type WorkPreference = { remote?: boolean; international?: boolean; iraqCities?: string[]; contractTypes?: string[] }

export type MatchableTalent = {
  experiences?: Experience[]
  hardSkills?: string[]
  softSkills?: string[]
  workPreference?: WorkPreference | null
}

export type JobMatch = {
  job: Job
  score: number
  skills: string[] // the job's skills the job seeker has
  category: boolean // they have worked in the job's category
  title: boolean // they have held a similar job title
}

const norm = (s: string) => s.trim().toLowerCase()

// Words too common in job titles to say two jobs are alike
const TITLE_NOISE = new Set(["senior", "junior", "lead", "head", "assistant", "officer", "specialist", "and", "of", "the", "for", "intern"])
const titleWords = (title: string) => norm(title).split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 2 && !TITLE_NOISE.has(w))

/**
 * Whether the job is somewhere the job seeker wants to work. Someone who hasn't said where they
 * want to work (no preference, or nothing picked) is open to every location.
 */
export function locationFits(talent: MatchableTalent, job: Job) {
  const p = talent.workPreference
  const cities = p?.iraqCities ?? []
  if (!p || (!p.remote && !p.international && cities.length === 0)) return true
  if (job.location.remote) return !!p.remote
  if (job.location.international) return !!p.international
  return cities.some((c) => norm(c) === norm(job.location.iraqCity))
}

/** How well one job suits the job seeker, or null when it doesn't match. */
export function matchJob(talent: MatchableTalent, job: Job): JobMatch | null {
  if (!job.open || !locationFits(talent, job)) return null
  // Contract types the job seeker wants (none chosen: any)
  const contracts = talent.workPreference?.contractTypes ?? []
  if (contracts.length && !contracts.includes(job.contractType)) return null

  const have = new Set([...(talent.hardSkills ?? []), ...(talent.softSkills ?? [])].map(norm))
  const skills = job.skills.filter((s) => have.has(norm(s)))
  const experiences = talent.experiences ?? []
  const category = experiences.some((e) => e.category && norm(e.category) === norm(job.category))
  const words = new Set(experiences.flatMap((e) => titleWords(e.title)))
  const title = titleWords(job.title).some((w) => words.has(w))

  // Worked in the field, or has a real share of the skills asked for
  const matches = category || skills.length >= 2 || (skills.length >= 1 && title)
  if (!matches) return null
  return { job, skills, category, title, score: (category ? 3 : 0) + skills.length * 2 + (title ? 2 : 0) }
}

/** The open jobs that suit the job seeker, best match first, newest first among equals. */
export function matchingJobs(talent: MatchableTalent, jobs: Job[]): JobMatch[] {
  return jobs
    .flatMap((job) => matchJob(talent, job) ?? [])
    .sort((a, b) => b.score - a.score || b.job.createdAt.localeCompare(a.job.createdAt))
}

