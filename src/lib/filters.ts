import { AGE_BUCKETS, EDUCATION, EXPERIENCE_BUCKETS, GENDERS, IRAQ_CITIES, JOB_CATEGORIES, LANGUAGES, MAIN_LANGUAGES } from "@/lib/options"
import type { Certification, Degree, Experience, LanguageSkill, Project, WorkPreference } from "@/lib/types"

// What an employer may see about a job seeker: first name only and no contact details, address,
// references or birth date.
export type PoolTalent = {
  id: string
  hiddenSections?: string[] // CV sections the job seeker doesn't show
  sectionOrder?: string[] // The order of their CV's sections
  extraSections?: Record<string, string[]> // Optional sections they added (see cv-extras)
  userId: string
  firstName: string
  avatarColor: string
  photoId: string
  title: string // profession
  country: string
  city: string
  summary: string
  hardSkills: string[]
  softSkills: string[]
  projects: Project[]
  workPreference: WorkPreference
  gender: string
  age: number | null
  education: string // highest degree level
  degrees: Degree[]
  certifications: Certification[]
  languages: LanguageSkill[]
  experiences: Experience[]
  totalMonths: number
  updatedAt: string
  conversationId: string | null
}

export type FilterKey = "category" | "gender" | "age" | "experience" | "education" | "languages" | "workType"

export type FilterDef = {
  key: FilterKey
  label: string
  // "any": talent matches one of the picked options. "all": talent has every picked option.
  mode: "any" | "all"
  options: { value: string; label: string }[]
  // Optional sub-choices shown when hovering an option (e.g. the fields of study under a degree level)
  children?: Record<string, { value: string; label: string }[]>
  // Options shown first, in their own section
  pinned?: { title: string; values: string[] }
  values: (t: PoolTalent) => string[]
}

/** The label of a picked value, including sub-choices ("Bachelor's · Nursing"). */
export function labelFor(def: FilterDef, value: string) {
  const own = def.options.find((o) => o.value === value)
  if (own) return own.label
  for (const [parent, list] of Object.entries(def.children ?? {})) {
    const child = list.find((c) => c.value === value)
    if (child) return `${def.options.find((o) => o.value === parent)?.label ?? parent} · ${child.label}`
  }
  return value
}

export type FilterState = Partial<Record<FilterKey, string[]>>

const plain = (list: string[]) => list.map((v) => ({ value: v, label: v }))

const bucketOf = <B extends { value: string; min: number; max: number }>(buckets: B[], n: number | null) =>
  n === null ? "" : (buckets.find((b) => n >= b.min && n <= b.max)?.value ?? "")

export function buildFilters(talents: PoolTalent[]): FilterDef[] {
  // Keep the standard lists, plus anything already in the data that isn't on them
  const withExtras = (base: string[], values: string[]) => [
    ...base,
    ...[...new Set(values)].filter((v) => !base.includes(v)).sort(),
  ]

  return [
    {
      key: "category",
      label: "Field",
      mode: "any",
      // Includes categories people wrote themselves
      options: plain(withExtras(JOB_CATEGORIES, talents.flatMap((t) => t.experiences.map((e) => e.category)).filter(Boolean))),
      values: (t) => [...new Set(t.experiences.map((e) => e.category))],
    },
    { key: "gender", label: "Gender", mode: "any", options: plain(GENDERS), values: (t) => [t.gender] },
    { key: "age", label: "Age", mode: "any", options: AGE_BUCKETS, values: (t) => [bucketOf(AGE_BUCKETS, t.age)] },
    {
      key: "experience",
      label: "Experience",
      mode: "any",
      options: EXPERIENCE_BUCKETS,
      values: (t) => [bucketOf(EXPERIENCE_BUCKETS, Math.floor(t.totalMonths / 12))],
    },
    {
      key: "education",
      label: "Education",
      mode: "any",
      options: plain(EDUCATION),
      // Hover a level to also pick the field of study (department) of a degree at that level
      children: Object.fromEntries(
        EDUCATION.map((level) => {
          const fields = [...new Set(talents.flatMap((t) => t.degrees.filter((d) => d.level === level && d.field).map((d) => d.field)))].sort()
          return [level, fields.map((f) => ({ value: `${level}|${f}`, label: f }))]
        })
      ),
      values: (t) => [t.education, ...t.degrees.filter((d) => d.level && d.field).map((d) => `${d.level}|${d.field}`)],
    },
    {
      key: "languages",
      label: "Languages",
      mode: "all",
      pinned: { title: "Main languages", values: MAIN_LANGUAGES },
      options: plain(withExtras(LANGUAGES, talents.flatMap((t) => t.languages.map((l) => l.language)))),
      values: (t) => t.languages.map((l) => l.language),
    },
    {
      key: "workType",
      label: "Work type",
      mode: "any",
      // Hover "City in Iraq" to pick the cities people would work in
      options: [
        { value: "remote", label: "Remote" },
        { value: "international", label: "International" },
        { value: "iraq", label: "City in Iraq" },
      ],
      children: {
        iraq: withExtras(IRAQ_CITIES, talents.flatMap((t) => t.workPreference.iraqCities))
          .filter((c) => talents.some((t) => t.workPreference.iraqCities.includes(c)))
          .map((c) => ({ value: `iraq|${c}`, label: c })),
      },
      values: (t) => [
        ...(t.workPreference.remote ? ["remote"] : []),
        ...(t.workPreference.international ? ["international"] : []),
        ...(t.workPreference.iraqCities.length ? ["iraq"] : []),
        ...t.workPreference.iraqCities.map((c) => `iraq|${c}`),
      ],
    },
  ]
}

function matchesFilter(t: PoolTalent, def: FilterDef, selected: string[] | undefined) {
  if (!selected?.length) return true
  const have = def.values(t)
  return def.mode === "all" ? selected.every((v) => have.includes(v)) : selected.some((v) => have.includes(v))
}

export function matchesSearch(t: PoolTalent, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [t.firstName, t.title, ...t.hardSkills, ...t.experiences.map((e) => e.title)].some((s) => s.toLowerCase().includes(q))
}

export function applyFilters(talents: PoolTalent[], defs: FilterDef[], state: FilterState, query: string) {
  return talents.filter((t) => matchesSearch(t, query) && defs.every((d) => matchesFilter(t, d, state[d.key])))
}

/**
 * For each option of `def`: how many talents would show if the user picked it,
 * given every other active filter. "any" filters count the option on its own
 * (what that option contributes); "all" filters count it added to the current picks.
 */
export function optionCounts(talents: PoolTalent[], defs: FilterDef[], def: FilterDef, state: FilterState, query: string) {
  const others = { ...state, [def.key]: undefined }
  const base = applyFilters(talents, defs, others, query)
  const current = state[def.key] ?? []
  const counts = new Map<string, number>()
  for (const opt of [...def.options, ...Object.values(def.children ?? {}).flat()]) {
    const pick = def.mode === "all" ? [...new Set([...current, opt.value])] : [opt.value]
    counts.set(opt.value, base.filter((t) => matchesFilter(t, def, pick)).length)
  }
  return counts
}
