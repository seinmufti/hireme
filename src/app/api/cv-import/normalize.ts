import { findContactDetail } from "@/lib/contact-guard"
import type { CvImport } from "@/lib/cv-import"
import { formatIraqiPhone, PHONE_PATTERN } from "@/lib/format"
import { LANGUAGES } from "@/lib/options"
import type { CvRead } from "./schema"

// Turns what the AI read into a CvImport the profile form can use: ids, clean dates, the app's phone
// format, languages from the app's list, and no contact details outside the contact fields.

const MONTH = /^\d{4}-\d{2}$/
const YEAR = /^\d{4}$/
const DAY = /^\d{4}-\d{2}-\d{2}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const newId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`
const clean = (s: string) => s.trim().replace(/[ \t]+/g, " ")

// Names the AI may use for languages the app lists under another name
const LANGUAGE_ALIASES: Record<string, string> = {
  sorani: "Kurdish",
  kurmanji: "Kurdish",
  badini: "Kurdish",
  "kurdish (sorani)": "Kurdish",
  "kurdish (kurmanji)": "Kurdish",
  farsi: "Persian",
  chinese: "Mandarin Chinese",
  mandarin: "Mandarin Chinese",
  aramaic: "Assyrian (Neo-Aramaic)",
  assyrian: "Assyrian (Neo-Aramaic)",
  syriac: "Assyrian (Neo-Aramaic)",
  filipino: "Tagalog",
}

function toAppLanguage(name: string) {
  const key = clean(name).toLowerCase()
  return LANGUAGES.find((l) => l.toLowerCase() === key) ?? LANGUAGE_ALIASES[key] ?? null
}

/** Iraqi numbers in the app's format; anything else can't be saved as the profile phone. */
function toIraqiPhone(raw: string) {
  const digits = raw.replace(/\D/g, "")
  const iraqi = digits.startsWith("964") || digits.startsWith("07") || /^7\d{9}$/.test(digits)
  const formatted = iraqi ? formatIraqiPhone(raw) : ""
  return PHONE_PATTERN.test(formatted) ? formatted : ""
}

export function normalizeCv(read: CvRead): CvImport {
  const uncertain = new Set(read.uncertain.filter((p) => p !== "file"))
  const flag = (path: string) => uncertain.add(path)

  // Text that employers see may not hold contact details: drop the line (descriptions) or the value
  const guard = (value: string, path: string) => {
    const v = clean(value)
    if (!v || !findContactDetail(v)) return v
    flag(path)
    return ""
  }
  const guardLines = (value: string, path: string) => {
    const lines = value
      .split("\n")
      .map((l) => clean(l.replace(/^\s*[-•*–·▪●]\s*/, "")))
      .filter(Boolean)
    const kept = lines.filter((l) => !findContactDetail(l))
    if (kept.length !== lines.length) flag(path)
    return kept.join("\n")
  }
  const month = (value: string, path: string) => {
    const v = clean(value)
    if (!v) return ""
    if (MONTH.test(v)) return v
    if (YEAR.test(v)) {
      flag(path)
      return `${v}-01`
    }
    flag(path)
    return ""
  }
  const year = (value: string, path: string) => {
    const v = clean(value).slice(0, 4)
    if (!v) return ""
    if (YEAR.test(v)) return v
    flag(path)
    return ""
  }

  const { user: u, talent: t } = read

  const phone = toIraqiPhone(u.phone)
  if (u.phone.trim() && !phone) flag("user.phone")
  const email = EMAIL.test(u.email.trim()) ? u.email.trim() : ""
  if (u.email.trim() && !email) flag("user.email")
  let linkedin = clean(u.linkedin)
  if (linkedin && !/^https?:\/\//.test(linkedin)) linkedin = `https://${linkedin.replace(/^\/+/, "")}`
  if (linkedin && !/linkedin\.com\//i.test(linkedin)) {
    flag("user.linkedin")
    linkedin = ""
  }
  const country = /^[A-Za-z]{2}$/.test(u.country.trim()) ? u.country.trim().toUpperCase() : "IQ"

  const dateOfBirth = DAY.test(t.dateOfBirth.trim()) ? t.dateOfBirth.trim() : ""
  if (t.dateOfBirth.trim() && !dateOfBirth) flag("talent.dateOfBirth")

  const skills = (list: string[], path: string) => {
    const seen = new Set<string>()
    return list
      .map((s) => guard(s, path))
      .filter((s) => s && !seen.has(s.toLowerCase()) && seen.add(s.toLowerCase()))
  }

  const languages: CvImport["talent"]["languages"] = []
  t.languages.forEach((l, i) => {
    const language = toAppLanguage(l.language)
    if (!language) return flag(`talent.languages.${i}`)
    if (languages.some((x) => x.language === language)) return
    languages.push({ language, speaking: l.speaking, reading: l.reading, attachmentIds: [] })
  })

  const experiences = t.experiences.map((e, i) => {
    const p = `talent.experiences.${i}`
    const start = month(e.start, `${p}.start`)
    const end = e.current ? "" : month(e.end, `${p}.end`)
    if (start && end && end < start) flag(`${p}.end`)
    const reference = e.reference && (e.reference.name.trim() || e.reference.phone.trim() || e.reference.email.trim())
      ? {
          name: clean(e.reference.name),
          position: clean(e.reference.position),
          phone: clean(e.reference.phone),
          email: clean(e.reference.email),
        }
      : null
    return {
      id: newId("x"),
      title: guard(e.title, `${p}.title`),
      employer: guard(e.employer, `${p}.employer`),
      category: guard(e.category, `${p}.category`),
      contractType: e.contractType,
      start,
      end,
      current: e.current,
      description: guardLines(e.description, `${p}.description`),
      reference,
    }
  })

  const degrees = t.degrees.map((d, i) => {
    const p = `talent.degrees.${i}`
    const startYear = year(d.startYear, `${p}.startYear`)
    const endYear = year(d.endYear, `${p}.endYear`)
    if (startYear && endYear && endYear < startYear) flag(`${p}.endYear`)
    return {
      id: newId("d"),
      level: d.level,
      name: guard(d.name, `${p}.name`),
      field: guard(d.field, `${p}.field`),
      institution: guard(d.institution, `${p}.institution`),
      status: d.status,
      startYear,
      endYear,
      attachmentIds: [],
    }
  })

  const certifications = t.certifications.map((c, i) => {
    const p = `talent.certifications.${i}`
    return {
      id: newId("c"),
      title: guard(c.title, `${p}.title`),
      institution: guard(c.institution, `${p}.institution`),
      issued: month(c.issued, `${p}.issued`),
      attachmentIds: [],
    }
  })

  const projects = t.projects.map((pr, i) => {
    const p = `talent.projects.${i}`
    let link = clean(pr.link)
    if (link && !/^https?:\/\//.test(link)) link = `https://${link}`
    return {
      id: newId("p"),
      name: guard(pr.name, `${p}.name`),
      link,
      description: guardLines(pr.description, `${p}.description`),
      start: month(pr.start, `${p}.start`),
      end: month(pr.end, `${p}.end`),
    }
  })

  return {
    user: {
      name: clean(u.name),
      title: guard(u.title, "user.title"),
      email,
      phone,
      linkedin,
      country,
      city: clean(u.city),
      address: clean(u.address),
    },
    talent: {
      summary: guardLines(t.summary, "talent.summary").replace(/\n/g, " "),
      gender: t.gender,
      dateOfBirth,
      hardSkills: skills(t.hardSkills, "talent.hardSkills"),
      softSkills: skills(t.softSkills, "talent.softSkills"),
      languages,
      degrees,
      certifications,
      experiences,
      projects,
    },
    uncertain: [...uncertain],
  }
}
