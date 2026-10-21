import type { ListingSection } from "@/lib/store"
import type { TalentInput, User } from "@/lib/types"

// "CV completeness": how much of the CV form is filled in, as a percentage (beyond the minimum needed for the Pool).
// Each part counts the same; the first one not done is suggested as the next step.

export type StrengthCheck =
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

export type StrengthTarget = ListingSection | "profession"

/** `skip`: checks not to suggest as the next step (they still count towards the percentage). */
export function cvStrength(user: Pick<User, "photoId" | "title" | "phone" | "email" | "city" | "linkedin" | "address">, p: TalentInput | null, skip: StrengthCheck[] = []) {
  const checks: { key: StrengthCheck; target: StrengthTarget; done: boolean }[] = [
    { key: "profession", target: "profession", done: !!user.title.trim() },
    { key: "contact", target: "personal", done: !!user.phone && !!user.email },
    { key: "personal", target: "personal", done: !!p?.gender && !!p.dateOfBirth && !!user.city },
    { key: "linkedin", target: "personal", done: !!user.linkedin?.trim() },
    { key: "address", target: "personal", done: !!user.address?.trim() },
    { key: "summary", target: "about", done: !!p?.summary?.trim() },
    { key: "experience", target: "work", done: !!p?.experiences.length },
    { key: "description", target: "work", done: !!p?.experiences[0]?.description?.trim() },
    { key: "education", target: "education", done: !!p?.degrees.length },
    { key: "hardSkills", target: "skills", done: (p?.hardSkills?.length ?? 0) >= 3 },
    { key: "softSkills", target: "skills", done: (p?.softSkills?.length ?? 0) >= 2 },
    { key: "languages", target: "languages", done: !!p?.languages.some((l) => l.language) },
    { key: "photo", target: "personal", done: !!user.photoId },
    { key: "certifications", target: "certifications", done: !!p?.certifications?.length },
    { key: "projects", target: "projects", done: !!p?.projects?.length },
  ]
  const done = checks.filter((c) => c.done).length
  return { percent: Math.round((done / checks.length) * 100), next: checks.find((c) => !c.done && !skip.includes(c.key)) ?? null }
}
