import type { Certification, Degree, Experience, LanguageSkill, Talent, User } from "@/lib/types"

// Saved data and backups from before the CV builder (data version 12) lack its fields.
// These fill anything missing with empty values; everything already there is kept as it is.

type Maybe<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type LegacyUser = Maybe<User, "photoId" | "country" | "address">
export type LegacyTalent = Maybe<
  Omit<Talent, "experiences" | "degrees" | "certifications" | "languages">,
  "summary" | "hardSkills" | "softSkills" | "projects" | "workPreference"
> & {
  experiences: Maybe<Experience, "description" | "reference">[]
  degrees: Maybe<Degree, "attachmentIds">[]
  certifications: Maybe<Certification, "attachmentIds">[]
  languages: Maybe<LanguageSkill, "attachmentIds">[]
}

export const EMPTY_WORK_PREFERENCE = { remote: false, international: false, iraqCities: [] as string[] }

export function withUserDefaults(u: LegacyUser): User {
  return { ...u, photoId: u.photoId ?? "", country: u.country || "IQ", address: u.address ?? "" }
}

export function withTalentDefaults(t: LegacyTalent): Talent {
  return {
    ...t,
    summary: t.summary ?? "",
    hardSkills: t.hardSkills ?? [],
    softSkills: t.softSkills ?? [],
    projects: t.projects ?? [],
    workPreference: { ...EMPTY_WORK_PREFERENCE, ...t.workPreference },
    experiences: (t.experiences ?? []).map((e) => ({ ...e, description: e.description ?? "", reference: e.reference ?? null })),
    degrees: (t.degrees ?? []).map((d) => ({ ...d, attachmentIds: d.attachmentIds ?? [] })),
    certifications: (t.certifications ?? []).map((c) => ({ ...c, attachmentIds: c.attachmentIds ?? [] })),
    languages: (t.languages ?? []).map((l) => ({ ...l, attachmentIds: l.attachmentIds ?? [] })),
  }
}

/** A profession for people who haven't written one: their latest job title, or "<field> graduate". */
export function professionFrom(t: Pick<LegacyTalent, "experiences" | "degrees"> | undefined) {
  return t?.experiences[0]?.title ?? (t?.degrees[0]?.field ? `${t.degrees[0].field} graduate` : "")
}
