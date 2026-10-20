import type { PoolTalent } from "@/lib/filters"
import { ageFrom, firstName, highestEducation, totalMonths } from "@/lib/format"
import type { Talent, User } from "@/lib/types"

const HIDDEN_REFERENCE = { name: "", position: "", phone: "", email: "" }

/**
 * A job seeker as an employer may see them (in The Pool and among a job's applicants).
 * Fields are picked one by one: the first name only and never the job seeker's contact details,
 * address, references or exact birth date. Employers reach out through HireMe messages.
 */
export function toPoolTalent(u: User, t: Talent, conversationId: string | null): PoolTalent {
  return {
    id: t.id,
    userId: t.userId,
    firstName: firstName(u.name),
    avatarColor: u.avatarColor,
    photoId: u.photoId,
    title: u.title,
    country: u.country,
    city: u.city,
    summary: t.summary,
    hardSkills: t.hardSkills,
    softSkills: t.softSkills,
    projects: t.projects,
    workPreference: t.workPreference,
    gender: t.gender,
    age: ageFrom(t.dateOfBirth),
    education: highestEducation(t.degrees),
    degrees: t.degrees,
    certifications: t.certifications,
    languages: t.languages,
    // References are private: employers only learn that one exists ("available on request")
    experiences: t.experiences.map((e) => ({ ...e, reference: e.reference && HIDDEN_REFERENCE })),
    totalMonths: totalMonths(t.experiences),
    updatedAt: t.updatedAt,
    conversationId,
  }
}
