"use client"

import { useStore } from "@/lib/store"
import type { Talent, User } from "@/lib/types"

// Home reads fields that other branches are adding at the same time (CV builder: skills, work
// preference, country; jobs: the jobs list and its matching). Until those land, everything here
// treats them as optional so Home works with or without them.
//
// TODO(after merging feature/cv-builder): use the real User/Talent types instead of these optional ones.
// TODO(after merging feature/jobs): use `jobs` from the store and `matchingJobs` from src/lib/matching.ts
// in place of useJobs and matchJobs below.

export type WorkPreference = { remote: boolean; international: boolean; iraqCities: string[] }

export type HomeUser = User & { country?: string; photoId?: string }
export type HomeTalent = Talent & {
  summary?: string
  hardSkills?: string[]
  softSkills?: string[]
  workPreference?: WorkPreference
}

export type HomeJob = {
  id: string
  title: string
  company: string
  category: string
  skills: string[]
  contractType: string
  location: { remote: boolean; international: boolean; iraqCity: string }
  createdAt: string
  open: boolean
}

export const EMPTY_PREFERENCE: WorkPreference = { remote: false, international: false, iraqCities: [] }

/** Every open job, newest first (none until the jobs branch adds them to the store). */
export function useJobs(): HomeJob[] {
  const jobs = useStore((s) => (s as unknown as { jobs?: HomeJob[] }).jobs)
  return (jobs ?? []).filter((j) => j.open !== false).sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
}

const norm = (s: string) => s.trim().toLowerCase()

/**
 * Jobs that fit the job seeker, best first: shared skills count most, then a job category they've
 * worked in, and the job has to fit their work preference (remote / their Iraqi cities / international)
 * when they've set one.
 */
export function matchJobs(talent: HomeTalent | null, jobs: HomeJob[]) {
  if (!talent) return []
  const skills = new Set([...(talent.hardSkills ?? []), ...(talent.softSkills ?? [])].map(norm))
  const categories = new Set(talent.experiences.map((e) => norm(e.category)).filter(Boolean))
  const pref = talent.workPreference
  const hasPref = !!pref && (pref.remote || pref.international || pref.iraqCities.length > 0)

  return jobs
    .flatMap((job) => {
      const loc = job.location ?? { remote: false, international: false, iraqCity: "" }
      if (hasPref) {
        const fits =
          (pref.remote && loc.remote) ||
          (pref.international && loc.international) ||
          (!!loc.iraqCity && (pref.iraqCities.length === 0 ? !pref.remote && !pref.international : pref.iraqCities.includes(loc.iraqCity)))
        if (!fits) return []
      }
      const sharedSkills = (job.skills ?? []).filter((s) => skills.has(norm(s))).length
      const score = sharedSkills * 2 + (categories.has(norm(job.category ?? "")) ? 3 : 0)
      return score > 0 ? [{ job, score }] : []
    })
    .sort((a, b) => b.score - a.score)
    .map((m) => m.job)
}

/** Saves the job seeker's work-type preference on their portfolio. */
export function saveWorkPreference(userId: string, workPreference: WorkPreference) {
  useStore.setState((s) => ({
    talents: s.talents.map((t) => (t.userId === userId ? { ...t, workPreference, updatedAt: new Date().toISOString() } : t)),
  }))
}

/** "🇮🇶" from "IQ". */
export const flagOf = (code: string) =>
  /^[A-Z]{2}$/i.test(code) ? String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)) : ""

/** The country's name in the page's language ("Iraq", "العراق"), or in English where the browser has no names for it. */
export function countryName(code: string, locale: string) {
  try {
    return new Intl.DisplayNames([locale, "en"], { type: "region" }).of(code.toUpperCase()) ?? code
  } catch {
    return code
  }
}

// Iraq's main cities (governorate centres first), for the work preference.
// TODO(after merging feature/cv-builder): use the Iraqi cities list from src/lib/options.ts.
export const IRAQI_CITIES = [
  "Baghdad", "Erbil", "Sulaymaniyah", "Duhok", "Halabja", "Kirkuk", "Mosul", "Basra", "Najaf", "Karbala",
  "Hillah", "Kut", "Diwaniyah", "Nasiriyah", "Amarah", "Samawah", "Ramadi", "Fallujah", "Baqubah", "Tikrit",
  "Samarra", "Zakho", "Ranya", "Koya", "Soran", "Akre", "Kalar", "Chamchamal", "Tal Afar", "Sinjar",
]
