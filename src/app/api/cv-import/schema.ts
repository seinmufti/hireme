import { z } from "zod"
import { CONTRACT_TYPES, DEGREE_STATUSES, EDUCATION, GENDERS, JOB_CATEGORIES, LANGUAGE_LEVELS } from "@/lib/options"

// What the AI returns when reading a CV. Every field is required; "" (or []) means "not in the CV".
// The route turns this into a CvImport (src/lib/cv-import.ts): ids, cleaned dates, phone format, contact guard.

const orEmpty = (values: string[]) => z.enum(["", ...values] as [string, ...string[]])
const LEVELS = LANGUAGE_LEVELS.map((l) => l.value)

export const CvReadSchema = z.object({
  user: z.object({
    name: z.string(),
    title: z.string().describe("Profession or headline, e.g. 'Accountant'"),
    email: z.string(),
    phone: z.string().describe("As written in the CV"),
    linkedin: z.string().describe("Full LinkedIn URL"),
    country: z.string().describe("ISO 3166-1 alpha-2 code of the country they live in, e.g. 'IQ'"),
    city: z.string(),
    address: z.string().describe("Street address or neighbourhood, without the city or country"),
  }),
  talent: z.object({
    summary: z.string().describe("Their profile / about-me paragraph, as written"),
    gender: orEmpty(GENDERS),
    dateOfBirth: z.string().describe("YYYY-MM-DD"),
    hardSkills: z.array(z.string()),
    softSkills: z.array(z.string()),
    languages: z.array(
      z.object({
        language: z.string().describe("English name, e.g. 'Kurdish', 'Arabic', 'English'"),
        speaking: z.enum(LEVELS as [string, ...string[]]),
        reading: z.enum(LEVELS as [string, ...string[]]),
      })
    ),
    degrees: z.array(
      z.object({
        level: orEmpty(EDUCATION),
        name: z.string().describe("e.g. 'BSc in Computer Science'"),
        field: z.string().describe("Field of study, e.g. 'Computer Science'"),
        institution: z.string(),
        status: orEmpty(DEGREE_STATUSES),
        startYear: z.string().describe("YYYY"),
        endYear: z.string().describe("YYYY; expected year while studying"),
      })
    ),
    certifications: z.array(
      z.object({
        title: z.string(),
        institution: z.string(),
        issued: z.string().describe("YYYY-MM"),
      })
    ),
    experiences: z.array(
      z.object({
        title: z.string(),
        employer: z.string(),
        category: z.string().describe(`One of: ${JOB_CATEGORIES.join(", ")}; or a short category of their own if none fits`),
        contractType: orEmpty(CONTRACT_TYPES),
        start: z.string().describe("YYYY-MM"),
        end: z.string().describe("YYYY-MM; empty when current"),
        current: z.boolean(),
        description: z.string().describe("Responsibilities and achievements, one per line, no bullet characters"),
        reference: z
          .object({ name: z.string(), position: z.string(), phone: z.string(), email: z.string() })
          .nullable()
          .describe("A referee given for this job, or null"),
      })
    ),
    projects: z.array(
      z.object({
        name: z.string(),
        link: z.string(),
        description: z.string(),
        start: z.string().describe("YYYY-MM"),
        end: z.string().describe("YYYY-MM"),
      })
    ),
  }),
  uncertain: z
    .array(z.string())
    .describe("Paths of fields you guessed or that look wrong, e.g. 'user.phone', 'talent.experiences.0.start', 'talent.languages.1'"),
})

export type CvRead = z.infer<typeof CvReadSchema>

export const SYSTEM_PROMPT = `You read job seekers' CVs for HireMe, a job platform in Iraq, and fill in their profile.

Rules:
- Only use what the CV says. When something isn't in the CV, leave it "" (or an empty list). Never invent details.
- Keep the CV's own wording for names, titles, institutions and descriptions. Write them in English when the CV is in English; otherwise keep the CV's language.
- List jobs, degrees and projects most recent first.
- Job descriptions: one responsibility or achievement per line, without bullet characters.
- Skills: hard skills are technical or job-specific (software, tools, methods, certifications-as-skills); soft skills are personal (communication, leadership, teamwork). Keep each short (1–4 words).
- Languages: "native"/"mother tongue" is Native; "fluent" is C1; "good"/"intermediate" is B1; "basic" is A2. When the CV gives one level, use it for both speaking and reading. Add the path to "uncertain" when you had to guess a level.
- Gender: only when the CV states it.
- Dates: months as YYYY-MM. When only a year is given, use that year with month 01 and add the path to "uncertain".
- A job is current when it ends with "present", "now", "current" or similar.
- Contact details (phone, email, links, messaging handles) go only in the contact fields and references, never in descriptions, titles or skills.
- Add to "uncertain" the path of any field you guessed, any field that seems wrong or inconsistent (e.g. a job ending before it starts), and anything hard to read.
- If the file is not a CV, return everything empty and add "file" to "uncertain".`
