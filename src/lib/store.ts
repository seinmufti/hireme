"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { CORE_TALENTS, CORE_USERS, DEMO_CONVERSATIONS, DEMO_MESSAGES, DEMO_TALENTS, DEMO_USERS } from "@/data/demo"
import { findContactDetail } from "@/lib/contact-guard"
import { rememberLogin } from "@/lib/recent-accounts"
import { replaceAllOnce, safeStorage, setOnRestored } from "@/lib/safe-storage"
import { ageFrom, PHONE_PATTERN } from "@/lib/format"
import { EMPTY_WORK_PREFERENCE, professionFrom, withTalentDefaults, withUserDefaults, type LegacyTalent, type LegacyUser } from "@/lib/normalize"
import { AVATAR_COLORS, type Role } from "@/lib/options"
import type { Conversation, Degree, Message, ProfileInput, Result, Talent, TalentInput, User } from "@/lib/types"

// All app data lives here. It starts as the built-in demo data and every change
// is saved to this browser's localStorage, so it only affects the current visitor.

/** Employers and recruiters give title and company; job seekers give contact details, gender and birthdate. */
export type NewAccountInput = {
  role: Role
  name: string
  title?: string
  company?: string
  phone?: string
  email?: string
  gender?: string
  dateOfBirth?: string
}

type Data = {
  users: User[]
  talents: Talent[]
  conversations: Conversation[]
  messages: Message[]
  currentUserId: string | null
}

type Actions = {
  switchAccount: (userId: string) => void
  createAccount: (input: NewAccountInput) => Result<{ userId: string }>
  saveTalent: (input: TalentInput) => Result
  setPortfolioVisible: (visible: boolean) => void
  updateProfile: (input: ProfileInput) => Result
  sendMessage: (seekerId: string, body: string) => Result<{ conversationId: string }>
  replyMessage: (conversationId: string, body: string) => Result
  markRead: (conversationId: string) => void
  resetDemo: () => void
}

const initialData = (): Data => ({
  users: DEMO_USERS,
  talents: DEMO_TALENTS,
  conversations: DEMO_CONVERSATIONS,
  messages: DEMO_MESSAGES,
  currentUserId: null,
})

const now = () => new Date().toISOString()
const newId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`
const fail = (error: string) => ({ ok: false as const, error })
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const emptyTalent = (userId: string, at: string): Talent => ({
  id: newId("t"),
  userId,
  gender: "",
  dateOfBirth: "",
  summary: "",
  degrees: [],
  certifications: [],
  languages: [],
  experiences: [],
  hardSkills: [],
  softSkills: [],
  projects: [],
  workPreference: EMPTY_WORK_PREFERENCE,
  published: true,
  createdAt: at,
  updatedAt: at,
})

/** Trims each line (bullet) and drops empty ones and leading bullet characters people type themselves. */
const cleanLines = (text: string) =>
  text
    .split("\n")
    .map((l) => l.replace(/^\s*[-•*·]\s*/, "").trim())
    .filter(Boolean)
    .join("\n")

const uniqueSkills = (list: string[]) => {
  const seen = new Set<string>()
  return list.map((s) => s.trim()).filter((s) => s && !seen.has(s.toLowerCase()) && seen.add(s.toLowerCase()))
}

export const useStore = create<Data & Actions>()(
  persist(
    (set, get) => {
      const me = () => get().users.find((u) => u.id === get().currentUserId) ?? null

      const addMessage = (conversationId: string, senderId: string, body: string) => {
        const at = now()
        set((s) => ({
          messages: [...s.messages, { id: newId("m"), conversationId, senderId, body, readAt: null, createdAt: at }],
          conversations: s.conversations.map((c) => (c.id === conversationId ? { ...c, updatedAt: at } : c)),
        }))
      }

      return {
        ...initialData(),

        switchAccount: (userId) => {
          rememberLogin(userId)
          set({ currentUserId: userId })
        },

        createAccount: (input) => {
          const { role } = input
          const clean = input.name.trim().replace(/\s+/g, " ")
          if (!clean) return fail("Please enter a full name.")
          const isSeeker = role === "SEEKER"
          const phone = input.phone?.trim() ?? ""
          const email = input.email?.trim() ?? ""
          if (isSeeker) {
            // New job seekers give their basics up front; they prefill the portfolio
            if (!PHONE_PATTERN.test(phone)) return fail("Please enter a phone number like +964 750 000 0103.")
            if (!EMAIL_PATTERN.test(email)) return fail("Please enter a valid email address.")
            if (!input.gender) return fail("Please choose a gender.")
            const age = input.dateOfBirth ? ageFrom(input.dateOfBirth) : null
            if (age === null || age < 16 || age > 80) return fail("Please choose your date of birth.")
          } else if (!input.company?.trim()) return fail("Please enter the company name.")

          const users = get().users
          const at = now()
          const user: User = {
            id: newId("u"),
            name: clean,
            role,
            // Job seekers describe their work in their portfolio instead
            title: isSeeker ? "" : (input.title?.trim() ?? ""),
            company: isSeeker ? "" : (input.company?.trim() ?? ""),
            avatarColor: AVATAR_COLORS[users.length % AVATAR_COLORS.length],
            email,
            phone,
            city: "",
            linkedin: "",
            bio: "",
            photoId: "",
            country: "IQ",
            address: "",
            createdAt: at,
          }
          // A job seeker starts with a draft portfolio holding what they just entered
          const talent: Talent | null = isSeeker
            ? { ...emptyTalent(user.id, at), gender: input.gender ?? "", dateOfBirth: input.dateOfBirth ?? "" }
            : null
          rememberLogin(user.id)
          set((s) => ({
            users: [...s.users, user],
            talents: talent ? [...s.talents, talent] : s.talents,
            currentUserId: user.id,
          }))
          return { ok: true, userId: user.id }
        },

        // The on/off switch on the profile: show or hide the portfolio from employers right away
        setPortfolioVisible: (visible) => {
          const user = me()
          if (user?.role !== "SEEKER") return
          const at = now()
          set((s) => {
            const existing = s.talents.find((t) => t.userId === user.id)
            if (existing) {
              return { talents: s.talents.map((t) => (t.id === existing.id ? { ...t, published: visible, updatedAt: at } : t)) }
            }
            return { talents: [...s.talents, { ...emptyTalent(user.id, at), published: visible }] }
          })
        },

        saveTalent: (input) => {
          const user = me()
          if (user?.role !== "SEEKER") return fail("Only job seekers have a portfolio.")
          // Drafts save as they are; only mistakes in what was entered block saving.
          // Whether the portfolio is complete enough for The Pool is checked separately (listingProblem).
          const problem = portfolioEntryProblem(input)
          if (problem) return fail(problem)

          const experiences = input.experiences.map((e) => ({
            ...e,
            title: e.title.trim(),
            employer: e.employer.trim(),
            category: e.category.trim(),
            end: e.current ? "" : e.end,
            description: cleanLines(e.description),
            // A reference with nothing filled in isn't kept
            reference: e.reference && Object.values(e.reference).some((v) => v.trim())
              ? { name: e.reference.name.trim(), position: e.reference.position.trim(), phone: e.reference.phone.trim(), email: e.reference.email.trim() }
              : null,
          }))
          const degrees = input.degrees.map((d) => ({ ...d, name: d.name.trim(), field: d.field.trim(), institution: d.institution.trim() }))
          const certifications = input.certifications.map((c) => ({ ...c, title: c.title.trim(), institution: c.institution.trim() }))
          const projects = input.projects
            .map((p) => ({ ...p, name: p.name.trim(), link: p.link.trim(), description: p.description.trim() }))
            .filter((p) => p.name || p.link || p.description)
          const data = {
            ...input,
            summary: input.summary.trim(),
            hardSkills: uniqueSkills(input.hardSkills),
            softSkills: uniqueSkills(input.softSkills),
            experiences,
            degrees,
            certifications,
            projects,
            // Rows where no language was picked aren't kept
            languages: input.languages.filter((l) => l.language),
            updatedAt: now(),
          }
          set((s) => {
            const existing = s.talents.find((t) => t.userId === user.id)
            return {
              talents: existing
                ? s.talents.map((t) => (t.id === existing.id ? { ...t, ...data } : t))
                : [...s.talents, { ...data, id: newId("t"), userId: user.id, createdAt: data.updatedAt }],
            }
          })
          return { ok: true }
        },

        updateProfile: (input) => {
          const user = me()
          if (!user) return fail("Pick an account first.")
          const name = input.name.trim()
          const email = input.email.trim()
          const linkedin = input.linkedin.trim()
          if (!name) return fail("Name is required.")
          const phone = input.phone.trim()
          if (phone && !PHONE_PATTERN.test(phone)) return fail("Phone number must look like +964 750 000 0103.")
          if (email && !EMAIL_PATTERN.test(email)) return fail("That email doesn't look right.")
          if (linkedin && !/^https?:\/\//.test(linkedin)) return fail("LinkedIn should be a full link starting with https://")
          // Job seekers have a profession (title) but no company
          const isSeeker = user.role === "SEEKER"
          const title = input.title.trim()
          if (isSeeker && findContactDetail(title)) return fail("Your profession can't contain contact details.")
          const patch: Partial<User> = {
            name,
            email,
            linkedin,
            phone,
            city: input.city.trim(),
            bio: input.bio.trim(),
            photoId: input.photoId,
            country: input.country || "IQ",
            address: input.address.trim(),
            title,
            ...(isSeeker ? {} : { company: input.company.trim() }),
          }
          set((s) => ({ users: s.users.map((u) => (u.id === user.id ? { ...u, ...patch } : u)) }))
          return { ok: true }
        },

        sendMessage: (seekerId, body) => {
          const employer = me()
          const text = body.trim()
          if (employer?.role !== "EMPLOYER") return fail("Only employers can message job seekers.")
          if (!text) return fail("Message can't be empty.")
          if (!get().users.some((u) => u.id === seekerId && u.role === "SEEKER")) return fail("Job seeker not found.")

          let conversation = get().conversations.find((c) => c.employerId === employer.id && c.seekerId === seekerId)
          if (!conversation) {
            const at = now()
            conversation = { id: newId("c"), employerId: employer.id, seekerId, createdAt: at, updatedAt: at }
            set((s) => ({ conversations: [...s.conversations, conversation!] }))
          }
          addMessage(conversation.id, employer.id, text)
          return { ok: true, conversationId: conversation.id }
        },

        replyMessage: (conversationId, body) => {
          const user = me()
          const text = body.trim()
          if (!user) return fail("Pick an account first.")
          if (!text) return fail("Message can't be empty.")
          const conversation = get().conversations.find(
            (c) => c.id === conversationId && (c.employerId === user.id || c.seekerId === user.id)
          )
          if (!conversation) return fail("Conversation not found.")
          addMessage(conversationId, user.id, text)
          return { ok: true }
        },

        markRead: (conversationId) => {
          const userId = get().currentUserId
          const unread = get().messages.some((m) => m.conversationId === conversationId && m.senderId !== userId && !m.readAt)
          if (!unread) return
          const at = now()
          set((s) => ({
            messages: s.messages.map((m) =>
              m.conversationId === conversationId && m.senderId !== userId && !m.readAt ? { ...m, readAt: at } : m
            ),
          }))
        },

        // The only way to replace everything on purpose; the previous data is kept as a backup (see safe-storage).
        // Starts over with one account per role: a single job seeker, not the generated ones.
        resetDemo: () => replaceAllOnce(() => set({ ...initialData(), users: CORE_USERS, talents: CORE_TALENTS })),
      }
    },
    {
      name: "hireme-demo",
      // Bump when the demo data or its shape changes so visitors start fresh
      version: 12,
      // v9 -> v10: jobs record start and end dates instead of years and months (see withJobDates)
      // v10 -> v11: the generated demo job seekers are added (see withDemoSeekers)
      // v11 -> v12: CV builder fields (photo, location, summary, skills, projects, job descriptions and
      //             references, attachments, work preference) are added empty (see withCvFields)
      migrate: (persisted, version) => {
        const data = withJobDates(migrateOlder(persisted, version))
        return withCvFields(version < 11 ? withDemoSeekers(data) : data)
      },
      storage: createJSONStorage(() => safeStorage),
      partialize: ({ users, talents, conversations, messages, currentUserId }) => ({
        users,
        talents,
        conversations,
        messages,
        currentUserId,
      }),
      // Rehydrated from the client shell, so server and first client render match
      skipHydration: true,
    }
  )
)

/**
 * v9 -> v10: jobs have start and end dates instead of years and months. The old durations can't be
 * turned into dates, so jobs start with blank dates (the demo jobs get theirs), and their profile
 * section asks for them. Works on data of any version, so it also finishes older upgrades.
 */
function withJobDates(data: Data): Data {
  const demo = DEMO_TALENTS.flatMap((t) => t.experiences)
  return {
    ...data,
    talents: (data.talents ?? []).map((t) => ({
      ...t,
      experiences: (t.experiences ?? []).map((e) => {
        if (typeof e.start === "string") return e
        const demoJob = demo.find((x) => x.id === e.id)
        if (demoJob) return demoJob
        return { id: e.id, title: e.title, employer: e.employer, category: e.category, contractType: e.contractType, start: "", end: "", current: false, description: "", reference: null }
      }),
    })),
  }
}

/**
 * v11 -> v12: fills in the CV builder fields that saved data lacks. Safe to run on any version.
 * The built-in demo accounts nobody has edited yet get the new demo CV details.
 */
function withCvFields(data: Data): Data {
  const demoTalent = (t: LegacyTalent) => DEMO_TALENTS.find((d) => d.id === t.id && t.updatedAt === d.updatedAt)
  const talents = (data.talents as LegacyTalent[]).map((t) => demoTalent(t) ?? withTalentDefaults(t))
  return {
    ...data,
    users: (data.users as LegacyUser[]).map((u) => {
      const filled = withUserDefaults(u)
      if (u.role !== "SEEKER" || u.photoId !== undefined) return filled
      // Job seekers from before professions existed get their latest job title (or degree) as profession
      const demo = DEMO_USERS.find((d) => d.id === u.id)
      return {
        ...filled,
        title: filled.title || professionFrom(talents.find((t) => t.userId === u.id)),
        address: filled.address || (demo?.address ?? ""),
      }
    }),
    talents,
  }
}

/** Adds the built-in demo job seekers that aren't in saved data yet; everything saved stays as it is. */
function withDemoSeekers(data: Data): Data {
  const haveUsers = new Set(data.users.map((u) => u.id))
  const haveTalents = new Set(data.talents.map((t) => t.id))
  return {
    ...data,
    users: [...data.users, ...DEMO_USERS.filter((u) => u.id.startsWith("u-seeker-") && !haveUsers.has(u.id))],
    talents: [...data.talents, ...DEMO_TALENTS.filter((t) => t.id.startsWith("t-seeker-") && !haveTalents.has(t.id))],
  }
}

function migrateOlder(persisted: unknown, version: number): Data {
  {
    {
        // v6/v7 -> v8: the single education level became a list of degrees (plus certifications).
        // Everything people entered carries over; the demo job seeker gets the new demo details.
        // v8 -> v9: degrees also record institution, status and years. Everything else carries over.
        if (version === 8) {
          const data = persisted as Data
          const demo = DEMO_TALENTS.find((t) => t.id === "t-aram")
          return {
            ...data,
            talents: data.talents.map((t) => ({
              ...t,
              degrees: t.degrees.map((d) => {
                const demoDegree = t.id === "t-aram" ? demo?.degrees.find((x) => x.id === d.id) : undefined
                if (demoDegree) return demoDegree
                // Degrees saved before these fields existed start blank
                const { institution = "", status = "", startYear = "", endYear = "" } = d as Partial<Degree> & typeof d
                return { ...d, institution, status, startYear, endYear, attachmentIds: [] }
              }),
            })),
          }
        }
        if (version === 6 || version === 7) {
          type OldTalent = Omit<Talent, "degrees" | "certifications"> & { education?: string }
          const data = persisted as Omit<Data, "talents"> & { talents: OldTalent[] }
          const demo = DEMO_TALENTS.find((t) => t.id === "t-aram")
          return {
            ...data,
            talents: data.talents.map(({ education, ...t }) =>
              t.id === "t-aram" && demo
                ? { ...t, degrees: demo.degrees, certifications: demo.certifications }
                : {
                    ...t,
                    degrees: education
                      ? [{ id: newId("d"), level: education, name: "", field: "", institution: "", status: "", startYear: "", endYear: "", attachmentIds: [] }]
                      : [],
                    certifications: [],
                  }
            ),
          }
        }
        // A version this code doesn't know about: keep whatever is stored rather than replacing it
        return (persisted && typeof persisted === "object" ? persisted : initialData()) as Data
    }
  }
}

export const useCurrentUser = () => useStore((s) => s.users.find((u) => u.id === s.currentUserId) ?? null)

export const unreadCountFor = (s: Data, userId: string) => {
  const mine = new Set(
    s.conversations.filter((c) => c.employerId === userId || c.seekerId === userId).map((c) => c.id)
  )
  return s.messages.filter((m) => mine.has(m.conversationId) && m.senderId !== userId && !m.readAt).length
}

/** Mistakes in what was entered, which block saving even a draft. Null when it can be saved. */
export function portfolioEntryProblem(p: TalentInput) {
  if (p.dateOfBirth) {
    const age = ageFrom(p.dateOfBirth)
    if (age === null || age < 16 || age > 80) return "Please enter a valid date of birth."
  }
  const badYears = p.degrees.findIndex((d) => d.startYear && d.endYear && Number(d.endYear) < Number(d.startYear))
  if (badYears >= 0) return `Degree ${badYears + 1} finishes before it starts. Please check the years.`
  const badJob = p.experiences.findIndex((e) => !e.current && MONTH_VALUE.test(e.start ?? "") && MONTH_VALUE.test(e.end ?? "") && e.end < e.start)
  if (badJob >= 0) return `Job ${badJob + 1} ends before it starts. Please check the dates.`
  const names = p.languages.map((l) => l.language).filter(Boolean)
  if (new Set(names).size !== names.length) return "Each language can only be listed once."
  const badLink = p.projects.findIndex((x) => x.link.trim() && !/^https?:\/\/\S+\.\S+/.test(x.link.trim()))
  if (badLink >= 0) return `The link of project ${badLink + 1} should be a full link starting with https://`
  const badProject = p.projects.findIndex((x) => MONTH_VALUE.test(x.start) && MONTH_VALUE.test(x.end) && x.end < x.start)
  if (badProject >= 0) return `Project ${badProject + 1} ends before it starts. Please check the dates.`
  const badReference = p.experiences.findIndex((e) => e.reference?.email.trim() && !EMAIL_PATTERN.test(e.reference.email.trim()))
  if (badReference >= 0) return `The reference email for job ${badReference + 1} doesn't look right.`
  // Everything employers see (references are never shown; project links are meant to be links)
  const contact = findContactDetail(
    [
      p.summary,
      ...p.hardSkills,
      ...p.softSkills,
      ...p.experiences.flatMap((e) => [e.title, e.employer, e.category, e.description]),
      ...p.degrees.flatMap((d) => [d.name, d.field, d.institution]),
      ...p.certifications.flatMap((c) => [c.title, c.institution]),
      ...p.projects.flatMap((x) => [x.name, x.description]),
    ].join("\n")
  )
  if (contact) return `Your portfolio contains ${contact}. Remove it: employers contact you through HireMe messages.`
  return null
}

const MONTH_VALUE = /^\d{4}-\d{2}$/
const jobComplete = (e: TalentInput["experiences"][number]) =>
  filled(e.title) &&
  filled(e.employer) &&
  filled(e.category) &&
  !!e.contractType &&
  MONTH_VALUE.test(e.start ?? "") &&
  (!!e.current || MONTH_VALUE.test(e.end ?? ""))

/** Profile sections that can hold details The Pool needs. */
// In CV order. "personal" holds personal details and contact details together.
export type ListingSection = "personal" | "about" | "work" | "education" | "skills" | "languages" | "certifications" | "projects"

/**
 * The profile sections that still need details before the portfolio is listed in The Pool.
 * An empty list means it's complete. Drafts can be saved at any point.
 * About me and skills are optional; projects only need a name once one is added.
 */
export function listingSectionsMissing(user: Pick<User, "phone" | "email">, p: TalentInput | null): ListingSection[] {
  const sections = new Set<ListingSection>()
  if (!p?.gender || !p?.dateOfBirth || !user.phone || !user.email) sections.add("personal")
  if (p?.experiences.some((e) => !jobComplete(e))) sections.add("work")
  if (!p?.degrees.length || p.degrees.some((d) => !degreeComplete(d))) sections.add("education")
  if (!p?.languages.some((l) => l.language)) sections.add("languages")
  if (p?.certifications.some((c) => !certificationComplete(c))) sections.add("certifications")
  if (p?.projects?.some((x) => !filled(x.name))) sections.add("projects")
  return [...sections]
}

// Saved data from older versions can lack newer fields; a missing field counts as empty instead of crashing
const filled = (value: string | undefined) => !!value?.trim()

const degreeComplete = (d: TalentInput["degrees"][number]) =>
  filled(d.level) && filled(d.name) && filled(d.field) && filled(d.institution) && filled(d.status) && filled(d.startYear) && filled(d.endYear)

const certificationComplete = (c: TalentInput["certifications"][number]) =>
  filled(c.title) && filled(c.institution) && /^\d{4}-\d{2}$/.test(c.issued ?? "")

/** What's still needed, as a list of plain-language items. Empty when the portfolio is complete. */
export function listingMissing(user: Pick<User, "phone" | "email">, p: TalentInput | null) {
  return listingSectionsMissing(user, p).length ? ["details"] : []
}

if (typeof window !== "undefined") {
  // Load saved data as soon as a store exists, so nothing can save over it with defaults.
  // (A store is created on page load, and again whenever this file is hot-reloaded in dev.)
  setOnRestored(() => useStore.persist.rehydrate())
  useStore.persist.rehydrate()
  // Keep open tabs in sync: when another tab saves, load that instead of overwriting it later.
  window.addEventListener("storage", (e) => {
    if (e.key === "hireme-demo") useStore.persist.rehydrate()
  })
}
