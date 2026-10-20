"use client"

import { IRAQ_CITIES } from "@/lib/options"
import { useStore } from "@/lib/store"
import type { Talent, User } from "@/lib/types"

// What Home reads from the store: the job seeker and their CV.

export type WorkPreference = Talent["workPreference"]
export type HomeUser = User
export type HomeTalent = Talent

export const EMPTY_PREFERENCE: WorkPreference = { remote: false, international: false, iraqCities: [] }

/** Saves the job seeker's work-type preference on their portfolio. */
export function saveWorkPreference(userId: string, workPreference: WorkPreference) {
  useStore.setState((s) => ({
    talents: s.talents.map((t) => (t.userId === userId ? { ...t, workPreference, updatedAt: new Date().toISOString() } : t)),
  }))
  // Jobs in the newly chosen places may match now
  useStore.getState().checkJobMatches()
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
