import type { TalentInput } from "@/lib/types"

/** Optional CV sections a job seeker can add (each a short list), in the order they appear on the CV. */
export const EXTRA_SECTIONS = ["courses", "publications", "awards", "volunteering", "maritalStatus"] as const
export type ExtraKey = (typeof EXTRA_SECTIONS)[number]
/** An added section's id, as used for its card, its form section and hiding it on the CV */
export type ExtraId = `extra-${ExtraKey}`

/** Sections with one answer picked from a list, not a list of their own */
export const EXTRA_CHOICES: Partial<Record<ExtraKey, string[]>> = {
  maritalStatus: ["Single", "Engaged", "Married", "Divorced", "Widowed"],
}

/** The section titles on the CV itself, which is always in English */
export const EXTRA_CV_TITLES: Record<ExtraKey, string> = {
  maritalStatus: "Marital status",
  volunteering: "Volunteering",
  awards: "Awards & achievements",
  courses: "Courses & training",
  publications: "Publications",
}

/** The CV's sections in their usual order */
const USUAL_ORDER: string[] = ["personal", "about", "work", "education", "skills", "languages", "certifications", "projects", ...EXTRA_SECTIONS.map((key) => `extra-${key}`)]
/** Section ids in the order the job seeker chose; any they haven't placed keep their usual place after those */
export const orderSections = <T extends string>(ids: T[], order?: string[]) => {
  const rank = (id: string) => (order?.includes(id) ? order.indexOf(id) : 1000 + USUAL_ORDER.indexOf(id))
  return [...ids].sort((a, b) => rank(a) - rank(b))
}

export const isExtraKey = (key: string): key is ExtraKey => (EXTRA_SECTIONS as readonly string[]).includes(key)
export const extraKeyOf = (id: string | null | undefined): ExtraKey | null => {
  const key = id?.startsWith("extra-") ? id.slice(6) : ""
  return isExtraKey(key) ? key : null
}

/** The sections added to this CV, in CV order; `filledOnly`: just those with something in them */
export const addedExtras = (p: Pick<TalentInput, "extraSections">, filledOnly = false) =>
  EXTRA_SECTIONS.filter((key) => (filledOnly ? !!p.extraSections?.[key]?.length : !!p.extraSections?.[key]))

/** What's saved: only sections with something in them */
export const keepFilledExtras = (extras: TalentInput["extraSections"]) =>
  Object.fromEntries(Object.entries(extras ?? {}).filter(([key, list]) => isExtraKey(key) && list.length)) as Record<string, string[]>
