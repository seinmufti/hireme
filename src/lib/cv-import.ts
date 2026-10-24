// Reading an uploaded CV with AI to pre-fill the job seeker's profile form.
// The server route (src/app/api/cv-import/route.ts) returns a CvImport; the profile form merges it
// into what's already typed with mergeCvImport, which never overwrites anything without asking.

import type { Translate } from "@/i18n/translate"

/** Contact and header details, which live on User. */
export type ImportedUser = {
  name: string
  title: string // profession, shown under the name
  email: string
  phone: string // "+964 750 000 0103", or "" when the CV has no Iraqi number
  linkedin: string
  country: string // ISO code, "IQ" by default
  city: string
  address: string
}

export type ImportedReference = { name: string; position: string; phone: string; email: string }

export type ImportedExperience = {
  id: string
  title: string
  employer: string
  category: string
  contractType: string
  start: string // "YYYY-MM" or ""
  end: string
  current: boolean
  description: string // one bullet per line
  reference: ImportedReference | null
}

export type ImportedDegree = {
  id: string
  level: string
  name: string
  field: string
  institution: string
  status: string
  startYear: string
  endYear: string
  attachmentIds: string[]
}

export type ImportedCertification = { id: string; title: string; institution: string; issued: string; attachmentIds: string[] }
export type ImportedLanguage = { language: string; speaking: string; reading: string; attachmentIds: string[] }
export type ImportedProject = { id: string; name: string; link: string; description: string; start: string; end: string }

/** The portfolio part (Talent). */
export type ImportedPortfolio = {
  summary: string
  gender: string
  dateOfBirth: string // "YYYY-MM-DD" or ""
  hardSkills: string[]
  softSkills: string[]
  languages: ImportedLanguage[]
  degrees: ImportedDegree[]
  certifications: ImportedCertification[]
  experiences: ImportedExperience[]
  projects: ImportedProject[]
}

export type CvImport = {
  user: ImportedUser
  talent: ImportedPortfolio
  /** Field paths the AI wasn't sure about, e.g. "user.phone", "talent.experiences.0.start". */
  uncertain: string[]
}

export const CV_IMPORT_MAX_BYTES = 10 * 1024 * 1024
export const CV_IMPORT_ACCEPT = ".pdf,.docx,.txt,image/jpeg,image/png,image/webp,image/gif"

/** Profile form sections a field path belongs to, so the right sections can turn yellow. */
export function sectionOf(path: string) {
  const [root, key] = path.split(".")
  // Personal details and contact share one section
  if (root === "user") return "personal"
  switch (key) {
    case "gender":
    case "dateOfBirth":
      return "personal"
    case "summary":
      return "about"
    case "hardSkills":
    case "softSkills":
      return "skills"
    case "languages":
      return "languages"
    case "degrees":
      return "education"
    case "certifications":
      return "certifications"
    case "experiences":
      return "work"
    case "projects":
      return "projects"
    default:
      return "personal"
  }
}

const FIELD_LABELS: Record<string, string> = {
  "user.name": "Full name",
  "user.title": "Profession",
  "user.email": "Email",
  "user.phone": "Phone number",
  "user.linkedin": "LinkedIn",
  "user.country": "Country",
  "user.city": "City",
  "user.address": "Address",
  "talent.summary": "About me",
  "talent.gender": "Gender",
  "talent.dateOfBirth": "Date of birth",
}

/**
 * "talent.experiences.1.start" -> "Job 2: start"; "user.phone" -> "Phone number".
 * Pass the page's t() to get it in the current language.
 */
export function describePath(path: string, t?: Translate) {
  const [, list, index, field] = path.split(".")
  const say = (key: string, english: string, vars?: Record<string, string | number>) =>
    t ? t.dynamic(`cvImport.fields.${key}`, english, vars) : english.replace(/{(w+)}/g, (_, k) => String(vars?.[k] ?? ""))
  const key = list
  if (FIELD_LABELS[path]) return say(key, FIELD_LABELS[path])
  const names: Record<string, [string, string]> = {
    experiences: ["job", "Job {n}"],
    degrees: ["degree", "Degree {n}"],
    certifications: ["certification", "Certification {n}"],
    languages: ["language", "Language {n}"],
    projects: ["project", "Project {n}"],
  }
  if (list === "hardSkills") return say("hardSkills", "Skills")
  if (list === "softSkills") return say("softSkills", "Skills")
  if (!names[list]) return path
  if (index === undefined) {
    const whole: Record<string, string> = { experiences: "Work experience", degrees: "Education", certifications: "Certifications", languages: "Languages", projects: "Projects" }
    return say(list, whole[list])
  }
  const n = Number(index)
  const [itemKey, itemText] = names[list]
  const item = Number.isNaN(n) ? say(list, itemText.replace(" {n}", "")) : say(itemKey, itemText, { n: n + 1 })
  return field ? `${item}: ${field.replace(/([A-Z])/g, " $1").toLowerCase()}` : item
}

/** A scalar the CV has that differs from what's already filled in; replaced only if the job seeker agrees. */
export type ImportConflict = { path: string; label: string; current: string; imported: string }

type Loose = Record<string, unknown>
const isEmpty = (v: unknown) => v === undefined || v === null || (typeof v === "string" && !v.trim())
const norm = (v: unknown) => String(v ?? "").trim().toLowerCase().replace(/\s+/g, " ")

/** Scalars that differ between the form and the CV. Only fields the form already has are compared. */
export function findConflicts(profile: Loose, portfolio: Loose, cv: CvImport): ImportConflict[] {
  const out: ImportConflict[] = []
  const check = (root: "user" | "talent", target: Loose, source: Loose) => {
    for (const [key, value] of Object.entries(source)) {
      if (typeof value !== "string" || !(key in target)) continue
      const current = target[key]
      if (typeof current !== "string" || isEmpty(current) || isEmpty(value) || norm(current) === norm(value)) continue
      const path = `${root}.${key}`
      out.push({ path, label: describePath(path), current, imported: value })
    }
  }
  check("user", profile, cv.user)
  check("talent", portfolio, cv.talent)
  return out
}

// What makes two list items "the same", so importing twice doesn't add duplicates
const ITEM_KEY: Record<string, (x: Loose) => string> = {
  experiences: (x) => `${norm(x.title)}|${norm(x.employer)}`,
  degrees: (x) => `${norm(x.name) || norm(x.level)}|${norm(x.institution)}`,
  certifications: (x) => norm(x.title),
  languages: (x) => norm(x.language),
  projects: (x) => norm(x.name),
}

/**
 * Fills the form from the CV: empty fields take the CV's value, conflicting ones only when their path is
 * in `replace`, and list items (jobs, degrees, skills, ...) the form doesn't have yet are added.
 * Keys the form doesn't have are left out, so this works with whichever fields the form holds.
 */
export function mergeCvImport<P extends object, T extends object>(
  profile: P,
  portfolio: T,
  cv: CvImport,
  replace: Set<string> = new Set()
): { profile: P; portfolio: T } {
  const fill = (root: "user" | "talent", target: Loose, source: Loose) => {
    const next: Loose = { ...target }
    for (const [key, value] of Object.entries(source)) {
      if (!(key in target)) continue
      const current = target[key]
      if (Array.isArray(value)) {
        const list = Array.isArray(current) ? current : []
        if (key === "hardSkills" || key === "softSkills") {
          const have = new Set(list.map(norm))
          next[key] = [...list, ...(value as string[]).filter((s) => !have.has(norm(s)))]
        } else if (ITEM_KEY[key]) {
          const have = new Set((list as Loose[]).map(ITEM_KEY[key]))
          next[key] = [...list, ...(value as Loose[]).filter((x) => !have.has(ITEM_KEY[key](x)))]
        }
      } else if (typeof value === "string") {
        if (isEmpty(value)) continue
        if (isEmpty(current) || replace.has(`${root}.${key}`)) next[key] = value
      }
    }
    return next
  }
  return {
    profile: fill("user", profile as Loose, cv.user) as P,
    portfolio: fill("talent", portfolio as Loose, cv.talent) as T,
  }
}

/** Important fields still empty after the import, to ask the job seeker for. Only fields the form has. */
export function stillMissing(profile: Loose, portfolio: Loose) {
  const wanted: [Loose, string][] = [
    [profile, "user.name"],
    [profile, "user.title"],
    [profile, "user.phone"],
    [profile, "user.email"],
    [profile, "user.city"],
    [portfolio, "talent.gender"],
    [portfolio, "talent.dateOfBirth"],
    [portfolio, "talent.summary"],
  ]
  const missing = wanted.filter(([obj, path]) => {
    const key = path.split(".")[1]
    return key in obj && isEmpty(obj[key])
  })
  const lists: [string, string][] = [
    ["languages", "talent.languages"],
    ["degrees", "talent.degrees"],
    ["experiences", "talent.experiences"],
  ]
  const emptyLists = lists.filter(([key]) => key in portfolio && Array.isArray(portfolio[key]) && !(portfolio[key] as unknown[]).length)
  return [...missing.map(([, p]) => p), ...emptyLists.map(([, p]) => p)]
}
