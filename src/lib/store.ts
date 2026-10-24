"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { CORE_TALENTS, CORE_USERS, DEMO_CONVERSATIONS, DEMO_MESSAGES, DEMO_TALENTS, DEMO_USERS, EMPLOYER_USERS } from "@/data/demo"
import { DEMO_APPLICATIONS, DEMO_JOBS, DEMO_NOTIFICATIONS, DEMO_SALARIES } from "@/data/demo-jobs"
import { findContactDetail } from "@/lib/contact-guard"
import { takesApplications, today } from "@/lib/jobs"
import { matchJob } from "@/lib/matching"
import { rememberLogin } from "@/lib/recent-accounts"
import { replaceAllOnce, safeStorage, setOnRestored } from "@/lib/safe-storage"
import { ageFrom, PHONE_PATTERN } from "@/lib/format"
import { EMPTY_WORK_PREFERENCE, professionFrom, withTalentDefaults, withUserDefaults, type LegacyTalent, type LegacyUser } from "@/lib/normalize"
import { IS_DEMO } from "@/lib/mode"
import { AVATAR_COLORS, toJobFunction, type Role } from "@/lib/options"
import type { Application, Conversation, Degree, Follow, Job, JobInput, Message, Notification, ProfileInput, Result, Saved, Talent, TalentInput, User } from "@/lib/types"

// All app data lives here. It starts as the built-in demo data and every change
// is saved to this browser's localStorage, so it only affects the current visitor.

/** Everyone gives their name; employers and recruiters also their title and company. Job seekers fill in the rest in their CV form. */
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

export type Data = {
  users: User[]
  talents: Talent[]
  conversations: Conversation[]
  messages: Message[]
  jobs: Job[]
  notifications: Notification[]
  applications: Application[]
  savedJobs: Saved[] // job seekers' saved jobs
  savedTalents: Saved[] // employers' and recruiters' saved job seekers (id: the job seeker's user id)
  follows: Follow[]
  currentUserId: string | null
}

type Actions = {
  switchAccount: (userId: string) => void
  createAccount: (input: NewAccountInput) => Result<{ userId: string }>
  saveTalent: (input: TalentInput) => Result
  updateProfile: (input: ProfileInput) => Result
  sendMessage: (seekerId: string, body: string, jobId?: string) => Result<{ conversationId: string }>
  replyMessage: (conversationId: string, body: string) => Result
  markRead: (conversationId: string) => void
  postJob: (input: JobInput) => Result<{ jobId: string; notified: number }>
  updateJob: (jobId: string, input: JobInput) => Result
  setJobOpen: (jobId: string, open: boolean) => void
  markNotificationRead: (notificationId: string) => void
  markAllNotificationsRead: () => void
  checkJobMatches: () => void
  applyToJob: (jobId: string, note: string) => Result
  withdrawApplication: (applicationId: string) => void
  setApplicationStatus: (applicationId: string, status: string) => void
  toggleSavedJob: (jobId: string) => void
  /** Show or hide one section of the signed-in job seeker's CV (its eye in the CV's categories) */
  toggleCvSection: (section: string) => void
  toggleSavedTalent: (seekerId: string) => void
  toggleFollow: (employerId: string) => void
  resetDemo: () => void
  /** Adds the demo companies (with their jobs) and 20 demo job seekers that aren't there yet; returns how many accounts it added. */
  loadDemoData: () => number
}

/**
 * What a first-time visitor (and "Reset demo") starts with: one account per role (job seeker, recruiter,
 * employer), the employer's own jobs, and the job seeker's notifications about them. The other demo
 * companies and generated job seekers aren't part of it.
 */
const initialData = (): Data => {
  // The real version starts empty; its data comes from the database once signed in (lib/real-sync.ts)
  if (!IS_DEMO) {
    return { users: [], talents: [], conversations: [], messages: [], jobs: [], notifications: [], applications: [], savedJobs: [], savedTalents: [], follows: [], currentUserId: null }
  }
  const users = CORE_USERS
  const ids = new Set(users.map((u) => u.id))
  const jobs = DEMO_JOBS.filter((j) => ids.has(j.employerId))
  const jobIds = new Set(jobs.map((j) => j.id))
  return {
    users,
    talents: CORE_TALENTS,
    conversations: DEMO_CONVERSATIONS,
    messages: DEMO_MESSAGES,
    jobs,
    notifications: DEMO_NOTIFICATIONS.filter((n) => ids.has(n.userId) && jobIds.has(n.jobId)),
    applications: DEMO_APPLICATIONS.filter((a) => ids.has(a.seekerId) && jobIds.has(a.jobId)),
    savedJobs: [],
    savedTalents: [],
    follows: [],
    currentUserId: null,
  }
}

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
  // Off until the profile is complete and the job seeker switches it on
  published: false,
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

const NO_STORAGE = { getItem: () => null, setItem: () => {}, removeItem: () => {} }

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

      /**
       * Notifies job seekers about every open job that matches them and they haven't heard about yet
       * (nor applied to). Runs whenever a match could turn up: a job is posted, edited or reopened, or a
       * job seeker signs in or changes their CV or work preference. Only job seekers listed in the Pool
       * (visible and complete) are notified. `userIds` limits it to those job seekers.
       */
      const notifyNewMatches = (userIds?: string[]) => {
        const { users, talents, jobs, notifications, applications } = get()
        const heard = new Set(notifications.map((n) => `${n.userId} ${n.jobId}`))
        const applied = new Set(applications.map((a) => `${a.seekerId} ${a.jobId}`))
        const at = now()
        const fresh = talents.flatMap((t) => {
          if (userIds && !userIds.includes(t.userId)) return []
          const u = users.find((x) => x.id === t.userId)
          if (u?.role !== "SEEKER" || listingMissing(u, t).length) return []
          return jobs
            .filter((j) => takesApplications(j) && !heard.has(`${u.id} ${j.id}`) && !applied.has(`${u.id} ${j.id}`) && matchJob(t, j))
            .map((j) => ({ id: newId("n"), userId: u.id, jobId: j.id, createdAt: at, readAt: null }))
        })
        if (fresh.length) set((s) => ({ notifications: [...s.notifications, ...fresh] }))
        return fresh.length
      }

      return {
        ...initialData(),

        switchAccount: (userId) => {
          rememberLogin(userId)
          set({ currentUserId: userId })
          notifyNewMatches([userId])
        },

        createAccount: (input) => {
          const { role } = input
          const clean = input.name.trim().replace(/\s+/g, " ")
          if (!clean) return fail("Please enter a full name.")
          const isSeeker = role === "SEEKER"
          const phone = input.phone?.trim() ?? ""
          const email = input.email?.trim() ?? ""
          // Job seekers sign up with just their name; anything else given must still be valid
          if (phone && !PHONE_PATTERN.test(phone)) return fail("Please enter a phone number like +964 750 000 0103.")
          if (email && !EMAIL_PATTERN.test(email)) return fail("Please enter a valid email address.")
          if (!isSeeker && !input.company?.trim()) return fail("Please enter the company name.")

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


        saveTalent: (input) => {
          const user = me()
          if (user?.role !== "SEEKER") return fail("Only job seekers have a CV.")
          // Drafts save as they are; only mistakes in what was entered block saving.
          // Whether the portfolio is complete enough for the Pool is checked separately (listingProblem).
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
                // Which sections are hidden is set by their eye buttons, not by the form
                ? s.talents.map((t) => (t.id === existing.id ? { ...t, ...data, hiddenSections: t.hiddenSections?.filter((id) => !id.startsWith("extra-") || !!data.extraSections?.[id.slice(6)]) } : t))
                : [...s.talents, { ...data, id: newId("t"), userId: user.id, createdAt: data.updatedAt }],
            }
          })
          notifyNewMatches([user.id])
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

        // `jobId`: messaging one of the job's applicants; the conversation remembers the job
        sendMessage: (seekerId, body, jobId) => {
          const employer = me()
          const text = body.trim()
          if (employer?.role !== "EMPLOYER") return fail("Only employers can message job seekers.")
          if (!text) return fail("Message can't be empty.")
          if (!get().users.some((u) => u.id === seekerId && u.role === "SEEKER")) return fail("Job seeker not found.")

          let conversation = get().conversations.find((c) => c.employerId === employer.id && c.seekerId === seekerId)
          if (!conversation) {
            const at = now()
            conversation = { id: newId("c"), employerId: employer.id, seekerId, createdAt: at, updatedAt: at, ...(jobId && { jobId }) }
            set((s) => ({ conversations: [...s.conversations, conversation!] }))
          } else if (jobId && !conversation.jobId) {
            const id = conversation.id
            set((s) => ({ conversations: s.conversations.map((c) => (c.id === id ? { ...c, jobId } : c)) }))
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

        // Posting a job notifies every job seeker it matches (see lib/matching.ts)
        postJob: (input) => {
          const employer = me()
          if (employer?.role !== "EMPLOYER") return fail("Only employers can post jobs.")
          const problem = jobInputProblem(input)
          if (problem) return fail(problem)
          const at = now()
          const job: Job = {
            ...cleanJob(input),
            id: newId("j"),
            employerId: employer.id,
            company: employer.company,
            createdAt: at,
            updatedAt: at,
            open: true,
          }
          set((s) => ({ jobs: [...s.jobs, job] }))
          // Job seekers listed in the Pool whom the job suits, then followers of the company who haven't heard yet
          const matched = notifyNewMatches()
          const heard = new Set(get().notifications.filter((n) => n.jobId === job.id).map((n) => n.userId))
          const followers = get().follows.filter((f) => f.employerId === employer.id && !heard.has(f.userId))
          if (followers.length) {
            set((s) => ({
              notifications: [
                ...s.notifications,
                ...followers.map((f) => ({ id: newId("n"), userId: f.userId, jobId: job.id, createdAt: at, readAt: null, kind: "follow" as const })),
              ],
            }))
          }
          return { ok: true, jobId: job.id, notified: matched + followers.length }
        },

        updateJob: (jobId, input) => {
          const employer = me()
          if (!get().jobs.some((j) => j.id === jobId && j.employerId === employer?.id)) return fail("Job not found.")
          const problem = jobInputProblem(input)
          if (problem) return fail(problem)
          const patch = { ...cleanJob(input), updatedAt: now() }
          set((s) => ({ jobs: s.jobs.map((j) => (j.id === jobId ? { ...j, ...patch } : j)) }))
          // An edited job can suit job seekers it didn't before
          notifyNewMatches()
          return { ok: true }
        },

        // Closed jobs drop out of search and matching; they can be reopened
        setJobOpen: (jobId, open) => {
          const employerId = get().currentUserId
          set((s) => ({
            jobs: s.jobs.map((j) => (j.id === jobId && j.employerId === employerId ? { ...j, open, updatedAt: now() } : j)),
          }))
          if (open) notifyNewMatches()
        },

        markNotificationRead: (notificationId) => {
          const userId = get().currentUserId
          if (!get().notifications.some((n) => n.id === notificationId && n.userId === userId && !n.readAt)) return
          const at = now()
          set((s) => ({ notifications: s.notifications.map((n) => (n.id === notificationId ? { ...n, readAt: at } : n)) }))
        },

        markAllNotificationsRead: () => {
          const userId = get().currentUserId
          if (!get().notifications.some((n) => n.userId === userId && !n.readAt)) return
          const at = now()
          set((s) => ({ notifications: s.notifications.map((n) => (n.userId === userId && !n.readAt ? { ...n, readAt: at } : n)) }))
        },

        // The signed-in job seeker's work preference changed somewhere outside saveTalent (e.g. on Home)
        checkJobMatches: () => {
          const userId = get().currentUserId
          if (userId) notifyNewMatches([userId])
        },

        // A job seeker applies with their CV (employers see it without contact details) and an optional note
        applyToJob: (jobId, note) => {
          const seeker = me()
          if (seeker?.role !== "SEEKER") return fail("Only job seekers can apply to jobs.")
          const job = get().jobs.find((j) => j.id === jobId)
          if (!job || !takesApplications(job)) return fail("This job is no longer taking applications.")
          if (get().applications.some((a) => a.jobId === jobId && a.seekerId === seeker.id)) return fail("You've already applied to this job.")
          const talent = get().talents.find((t) => t.userId === seeker.id) ?? null
          if (listingMissing(seeker, talent).length) return fail("Please finish your CV before applying.")
          const text = note.trim()
          const contact = findContactDetail(text)
          if (contact) return fail(`Your note contains ${contact}. Remove it: the employer contacts you through HireMe messages.`)
          const at = now()
          const application: Application = { id: newId("a"), jobId, seekerId: seeker.id, note: text, status: "Applied", createdAt: at, updatedAt: at }
          set((s) => ({ applications: [...s.applications, application] }))
          return { ok: true }
        },

        // Only while the employer hasn't looked at it yet
        withdrawApplication: (applicationId) => {
          const seekerId = get().currentUserId
          set((s) => ({ applications: s.applications.filter((a) => !(a.id === applicationId && a.seekerId === seekerId && a.status === "Applied")) }))
        },

        setApplicationStatus: (applicationId, status) => {
          const employerId = get().currentUserId
          const application = get().applications.find((a) => a.id === applicationId)
          if (!application || !get().jobs.some((j) => j.id === application.jobId && j.employerId === employerId)) return
          set((s) => ({ applications: s.applications.map((a) => (a.id === applicationId ? { ...a, status, updatedAt: now() } : a)) }))
        },

        // The only way to replace everything on purpose; the previous data is kept as a backup (see safe-storage).
        // Starts over with the same demo a first-time visitor gets (see initialData).
        // Saved for later: a heart on a job (job seekers), a bookmark on a job seeker (employers, recruiters)
        toggleCvSection: (section) => {
          const userId = get().currentUserId
          set((s) => ({
            talents: s.talents.map((t) =>
              t.userId !== userId
                ? t
                : {
                    ...t,
                    hiddenSections: (t.hiddenSections ?? []).includes(section)
                      ? (t.hiddenSections ?? []).filter((x) => x !== section)
                      : [...(t.hiddenSections ?? []), section],
                  }
            ),
          }))
        },
        toggleSavedJob: (jobId) => {
          const userId = get().currentUserId
          if (!userId) return
          set((s) => ({
            savedJobs: s.savedJobs.some((x) => x.userId === userId && x.id === jobId)
              ? s.savedJobs.filter((x) => !(x.userId === userId && x.id === jobId))
              : [...s.savedJobs, { userId, id: jobId, at: now() }],
          }))
        },

        toggleSavedTalent: (seekerId) => {
          const userId = get().currentUserId
          if (!userId) return
          set((s) => ({
            savedTalents: s.savedTalents.some((x) => x.userId === userId && x.id === seekerId)
              ? s.savedTalents.filter((x) => !(x.userId === userId && x.id === seekerId))
              : [...s.savedTalents, { userId, id: seekerId, at: now() }],
          }))
        },

        // Following a company: its new jobs reach the job seeker's notifications
        toggleFollow: (employerId) => {
          const userId = get().currentUserId
          if (!userId) return
          set((s) => ({
            follows: s.follows.some((f) => f.userId === userId && f.employerId === employerId)
              ? s.follows.filter((f) => !(f.userId === userId && f.employerId === employerId))
              : [...s.follows, { userId, employerId, at: now() }],
          }))
        },

        resetDemo: () => replaceAllOnce(() => set(initialData())),

        loadDemoData: () => {
          const before = get().users.length
          set((s) => withDemoData(s))
          return get().users.length - before
        },
      }
    },
    {
      name: "hireme-demo",
      // Bump when the demo data or its shape changes so visitors start fresh
      version: 18,
      // v9 -> v10: jobs record start and end dates instead of years and months (see withJobDates)
      // v10 -> v11: the generated demo job seekers are added (see withDemoSeekers)
      // v11 -> v12: CV builder fields (photo, location, summary, skills, projects, job descriptions and
      //             references, attachments, work preference) are added empty (see withCvFields)
      // v12 -> v13: job postings and notifications, with the demo companies and their jobs (see withJobPostings)
      // v13 -> v14: job applications, with a few demo ones (see withApplications)
      // v14 -> v15: jobs have an application deadline; saved ones get 30 days from posting (see withDeadlines)
      // v15 -> v16: the guest account is added (see withGuest)
      // v16 -> v17: job salaries, saved jobs and job seekers, followed companies (see withSalaries)
      // v17 -> v18: categories are job functions, not industries (see withJobFunctions)
      migrate: (persisted, version) => {
        let data = withJobDates(migrateOlder(persisted, version))
        if (version < 11) data = withDemoSeekers(data)
        data = withCvFields(data)
        if (version < 13) data = withJobPostings(data)
        if (version < 14) data = withApplications(data)
        if (version < 15) data = withDeadlines(data)
        if (version < 16) data = withGuest(data)
        if (version < 17) data = withSalaries(data)
        if (version < 18) data = withJobFunctions(data)
        return data
      },
      // The demo saves to this browser; the real version saves nothing here (others' data mustn't stay on a
      // shared computer after signing out): the database is the store (lib/real-sync.ts)
      storage: createJSONStorage(() => (IS_DEMO ? safeStorage : NO_STORAGE)),
      partialize: ({ users, talents, conversations, messages, jobs, notifications, applications, savedJobs, savedTalents, follows, currentUserId }) => ({
        users,
        talents,
        conversations,
        messages,
        jobs,
        notifications,
        applications,
        savedJobs,
        savedTalents,
        follows,
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

/**
 * v12 -> v13: adds job postings and notifications (empty lists if the saved data has none), plus the
 * demo companies, their jobs and the demo notifications that aren't there yet. Everything saved stays.
 * Works whether or not the v12 step ran.
 */
function withJobPostings(data: Data): Data {
  const jobs = data.jobs ?? []
  const notifications = data.notifications ?? []
  const haveUsers = new Set(data.users.map((u) => u.id))
  const haveJobs = new Set(jobs.map((j) => j.id))
  const haveNotifications = new Set(notifications.map((n) => n.id))
  return {
    ...data,
    users: [...data.users, ...EMPLOYER_USERS.filter((u) => !haveUsers.has(u.id))],
    jobs: [...jobs, ...DEMO_JOBS.filter((j) => !haveJobs.has(j.id))],
    notifications: [...notifications, ...DEMO_NOTIFICATIONS.filter((n) => !haveNotifications.has(n.id))],
  }
}

/** v14 -> v15: jobs saved before deadlines existed get one 30 days after they were posted (the demo jobs get theirs). */
/** v16 -> v17: demo jobs get their salaries (others none); nothing saved or followed yet. */
/** Jobs' and work experience's categories as job functions (see toJobFunction). */
export function withJobFunctions<D extends Pick<Data, "jobs" | "talents">>(data: D): D {
  return {
    ...data,
    jobs: data.jobs.map((j) => ({ ...j, category: toJobFunction(j.category, j.title) })),
    talents: data.talents.map((t) => ({ ...t, experiences: (t.experiences ?? []).map((e) => ({ ...e, category: toJobFunction(e.category, e.title) })) })),
  }
}

function withSalaries(data: Data): Data {
  return {
    ...data,
    jobs: data.jobs.map((j) => ({ ...j, salary: j.salary ?? DEMO_SALARIES[j.id] ?? null })),
    savedJobs: data.savedJobs ?? [],
    savedTalents: data.savedTalents ?? [],
    follows: data.follows ?? [],
  }
}

/**
 * The job a conversation is about: the one it started from, or else the latest job of this employer the
 * job seeker applied to. Undefined when there's none (e.g. found in the Pool).
 */
export function conversationJob(c: Conversation, jobs: Job[], applications: Application[]) {
  if (c.jobId) return jobs.find((j) => j.id === c.jobId)
  const theirs = new Set(jobs.filter((j) => j.employerId === c.employerId).map((j) => j.id))
  const applied = applications.filter((a) => a.seekerId === c.seekerId && theirs.has(a.jobId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  return applied && jobs.find((j) => j.id === applied.jobId)
}

/** Adds the one guest account to data saved before guests existed. */
function withGuest(data: Data): Data {
  if (data.users.some((u) => u.role === "GUEST")) return data
  return { ...data, users: [...data.users, ...CORE_USERS.filter((u) => u.role === "GUEST")] }
}

function withDeadlines(data: Data): Data {
  return {
    ...data,
    jobs: data.jobs.map((j) => {
      if (j.deadline) return j
      const demo = DEMO_JOBS.find((d) => d.id === j.id)
      return { ...j, deadline: demo?.deadline ?? new Date(new Date(j.createdAt).getTime() + 30 * 86_400_000).toISOString().slice(0, 10) }
    }),
  }
}

/** v13 -> v14: adds job applications (an empty list if the saved data has none) and the demo ones whose job seeker and job exist. */
function withApplications(data: Data): Data {
  const applications = data.applications ?? []
  const have = new Set(applications.map((a) => a.id))
  const users = new Set(data.users.map((u) => u.id))
  const jobs = new Set(data.jobs.map((j) => j.id))
  const demo = DEMO_APPLICATIONS.filter((a) => !have.has(a.id) && users.has(a.seekerId) && jobs.has(a.jobId))
  return { ...data, applications: [...applications, ...demo] }
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

export const unreadNotificationsFor = (s: Data, userId: string) => s.notifications.filter((n) => n.userId === userId && !n.readAt).length

/** What's wrong with a job posting, or null when it can be posted. */
export function jobInputProblem(input: JobInput) {
  if (!input.title.trim()) return "Please enter a job title."
  if (!input.category.trim()) return "Please choose a category."
  if (!input.contractType) return "Please choose a contract type."
  const l = input.location
  if (!l.remote && !l.international && !l.iraqCity) return "Please choose the city the job is in."
  if (!input.description.trim()) return "Please describe the job."
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.deadline ?? "")) return "Please choose the last day to apply."
  if (input.deadline < today()) return "The last day to apply can't be in the past."
  const pay = input.salary
  if (pay && [pay.min, pay.max].some((n) => n !== null && !(Number.isFinite(n) && n > 0))) return "Please enter the salary as a number."
  if (pay?.min && pay.max && pay.min > pay.max) return "The lowest salary can't be more than the highest."
  return null
}

function cleanJob(input: JobInput): JobInput {
  const skills = input.skills.map((s) => s.trim().replace(/\s+/g, " ")).filter(Boolean)
  const l = input.location
  return {
    title: input.title.trim(),
    category: input.category.trim(),
    contractType: input.contractType,
    description: input.description.trim(),
    deadline: input.deadline,
    // No amount given: no salary shown
    salary: input.salary && (input.salary.min || input.salary.max) ? { min: input.salary.min || null, max: input.salary.max || null, currency: input.salary.currency } : null,
    // Each skill once, ignoring case
    skills: skills.filter((s, i) => skills.findIndex((x) => x.toLowerCase() === s.toLowerCase()) === i),
    // A job is in exactly one kind of place
    location: { remote: l.remote, international: !l.remote && l.international, iraqCity: l.remote || l.international ? "" : l.iraqCity },
  }
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
export const jobComplete = (e: TalentInput["experiences"][number]) =>
  filled(e.title) &&
  filled(e.employer) &&
  filled(e.category) &&
  !!e.contractType &&
  MONTH_VALUE.test(e.start ?? "") &&
  (!!e.current || MONTH_VALUE.test(e.end ?? ""))

/** Profile sections that can hold details the Pool needs. */
// In CV order. "personal" holds personal details and contact details together.
export type ListingSection = "personal" | "about" | "work" | "education" | "skills" | "languages" | "certifications" | "projects"

/**
 * The profile sections that still need details before the portfolio is listed in the Pool.
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
export const filled = (value: string | undefined) => !!value?.trim()

export const degreeComplete = (d: TalentInput["degrees"][number]) =>
  filled(d.level) && filled(d.name) && filled(d.field) && filled(d.institution) && filled(d.status) && filled(d.startYear) && filled(d.endYear)

export const certificationComplete = (c: TalentInput["certifications"][number]) =>
  filled(c.title) && filled(c.institution) && /^\d{4}-\d{2}$/.test(c.issued ?? "")

/**
 * Sections that need details but have no entry or field to point at: no degree yet, or no language yet.
 * Everything else that's missing is shown on the job, degree, license or field itself.
 */
export function sectionsMissingEntries(p: TalentInput | null): ListingSection[] {
  const sections: ListingSection[] = []
  if (!p?.degrees.length) sections.push("education")
  if (!p?.languages.some((l) => l.language)) sections.push("languages")
  return sections
}

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
  if (IS_DEMO) {
    window.addEventListener("storage", (e) => {
      if (e.key === "hireme-demo") useStore.persist.rehydrate()
    })
  }
}

/** How many of the generated job seekers "Load demo data" adds. */
const DEMO_SEEKER_COUNT = 20

/**
 * "Load demo data": the other demo companies with their jobs, and the first 20 generated job seekers, plus
 * the demo applications between them. Only what isn't there yet is added; everything saved stays as it is.
 */
function withDemoData(data: Data): Data {
  const seekers = DEMO_USERS.filter((u) => u.id.startsWith("u-seeker-")).slice(0, DEMO_SEEKER_COUNT)
  const newUsers = [...EMPLOYER_USERS, ...seekers].filter((u) => !data.users.some((x) => x.id === u.id))
  const users = [...data.users, ...newUsers]
  const userIds = new Set(users.map((u) => u.id))
  const newTalents = DEMO_TALENTS.filter((t) => seekers.some((u) => u.id === t.userId) && !data.talents.some((x) => x.id === t.id))
  const newJobs = DEMO_JOBS.filter((j) => userIds.has(j.employerId) && !data.jobs.some((x) => x.id === j.id))
  const jobs = [...data.jobs, ...newJobs]
  const jobIds = new Set(jobs.map((j) => j.id))
  const newApplications = DEMO_APPLICATIONS.filter(
    (a) => userIds.has(a.seekerId) && jobIds.has(a.jobId) && !data.applications.some((x) => x.id === a.id)
  )
  return {
    ...data,
    users,
    talents: [...data.talents, ...newTalents],
    jobs,
    applications: [...data.applications, ...newApplications],
  }
}
