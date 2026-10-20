"use client"

import { useMemo } from "react"
import { matchingJobs } from "@/lib/matching"
import { IRAQ_CITIES } from "@/lib/options"
import { useStore } from "@/lib/store"
import type { Job, Talent, User } from "@/lib/types"

// What Home reads from the store: the job seeker, their CV, and the jobs that match it.

export type WorkPreference = Talent["workPreference"]
export type HomeUser = User
export type HomeTalent = Talent
export type HomeJob = Job

export const EMPTY_PREFERENCE: WorkPreference = { remote: false, international: false, iraqCities: [] }

/** Every open job, newest first. */
export function useJobs(): HomeJob[] {
  const jobs = useStore((s) => s.jobs)
  return useMemo(() => jobs.filter((j) => j.open).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [jobs])
}

/** Jobs that fit the job seeker, best first (see lib/matching.ts, also used for notifications). */
export function matchJobs(talent: HomeTalent | null, jobs: HomeJob[]) {
  return talent ? matchingJobs(talent, jobs).map((m) => m.job) : []
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

// Iraq's cities, for the work preference (the same list as the CV form)
export const IRAQI_CITIES = IRAQ_CITIES
