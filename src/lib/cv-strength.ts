import type { ListingSection } from "@/lib/store"
import type { TalentInput, User } from "@/lib/types"

// Two measures of a CV, as percentages. In each, every check counts the same and the first one not done
// is suggested as the next step.
// - Completeness: how much of the CV form is filled in.
// - Strength: how convincing what's filled in is (a real summary, enough bullet points, numbers, skills...).

export type CompletenessCheck =
  | "photo"
  | "profession"
  | "contact"
  | "linkedin"
  | "address"
  | "personal"
  | "summary"
  | "experience"
  | "description"
  | "education"
  | "hardSkills"
  | "softSkills"
  | "languages"
  | "certifications"
  | "projects"

export type StrengthCheck =
  | "summaryLength"
  | "bullets"
  | "numbers"
  | "allDescribed"
  | "moreHardSkills"
  | "moreSoftSkills"
  | "secondLanguage"
  | "photo"
  | "certification"
  | "project"
  | "linkedin"

export type CvTarget = ListingSection | "profession"

type CvUser = Pick<User, "photoId" | "title" | "phone" | "email" | "city" | "linkedin" | "address">
type Check<K> = { key: K; target: CvTarget; done: boolean }

const score = <K>(checks: Check<K>[], skip: K[]) => ({
  percent: Math.round((checks.filter((c) => c.done).length / checks.length) * 100),
  // `skip`: not suggested here (they still count), e.g. the photo, which has its own pencil on the CV page
  next: checks.find((c) => !c.done && !skip.includes(c.key)) ?? null,
})

/** All skills, technical and personal together */
const skillCount = (p: TalentInput | null) => (p?.hardSkills?.length ?? 0) + (p?.softSkills?.length ?? 0)

const lines = (text = "") => text.split("\n").map((l) => l.trim()).filter(Boolean)

/** How much of the CV form is filled in. */
export function cvCompleteness(user: CvUser, p: TalentInput | null, skip: CompletenessCheck[] = []) {
  const checks: Check<CompletenessCheck>[] = [
    { key: "profession", target: "profession", done: !!user.title.trim() },
    { key: "contact", target: "personal", done: !!user.phone && !!user.email },
    { key: "personal", target: "personal", done: !!p?.gender && !!p.dateOfBirth && !!user.city },
    { key: "linkedin", target: "personal", done: !!user.linkedin?.trim() },
    { key: "address", target: "personal", done: !!user.address?.trim() },
    { key: "summary", target: "about", done: !!p?.summary?.trim() },
    { key: "experience", target: "work", done: !!p?.experiences.length },
    { key: "description", target: "work", done: !!p?.experiences[0]?.description?.trim() },
    { key: "education", target: "education", done: !!p?.degrees.length },
    // Skills count together (technical and personal ones are one list on the CV)
    { key: "hardSkills", target: "skills", done: skillCount(p) >= 3 },
    { key: "softSkills", target: "skills", done: skillCount(p) >= 5 },
    { key: "languages", target: "languages", done: !!p?.languages.some((l) => l.language) },
    { key: "photo", target: "personal", done: !!user.photoId },
    { key: "certifications", target: "certifications", done: !!p?.certifications?.length },
    { key: "projects", target: "projects", done: !!p?.projects?.length },
  ]
  return score(checks, skip)
}

/** How convincing the CV is: what recruiters look for beyond the fields being filled in. */
export function cvStrength(user: CvUser, p: TalentInput | null, skip: StrengthCheck[] = []) {
  const jobs = p?.experiences ?? []
  const checks: Check<StrengthCheck>[] = [
    // 2–4 sentences, not a few words
    { key: "summaryLength", target: "about", done: (p?.summary?.trim().length ?? 0) >= 150 },
    { key: "bullets", target: "work", done: lines(jobs[0]?.description).length >= 3 },
    // Achievements with numbers ("Increased sales by 20%")
    { key: "numbers", target: "work", done: jobs.some((j) => /\d/.test(j.description ?? "")) },
    { key: "allDescribed", target: "work", done: jobs.length > 0 && jobs.every((j) => !!j.description?.trim()) },
    { key: "moreHardSkills", target: "skills", done: skillCount(p) >= 8 },
    { key: "moreSoftSkills", target: "skills", done: skillCount(p) >= 10 },
    { key: "secondLanguage", target: "languages", done: (p?.languages.filter((l) => l.language).length ?? 0) >= 2 },
    { key: "photo", target: "personal", done: !!user.photoId },
    { key: "certification", target: "certifications", done: !!p?.certifications?.length },
    { key: "project", target: "projects", done: !!p?.projects?.length },
    { key: "linkedin", target: "personal", done: !!user.linkedin?.trim() },
  ]
  return score(checks, skip)
}
