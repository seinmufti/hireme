import type { Application, Conversation, Follow, Job, Message, Notification, ProfileView, Saved, Talent, User } from "@/lib/types"

// What "Load demo data" adds besides the accounts: job seekers' applications at every stage (some viewed,
// shortlisted, contacted, at interview, accepted or rejected, with the dates each happened), the
// conversations employers started about them, saved jobs, followed companies, and the newer CV parts
// (where each job was, added sections). Always the same, so loading it twice adds nothing new.

const DAY = 86_400_000
const plus = (iso: string, days: number) => new Date(Date.parse(iso) + days * DAY).toISOString()
/** Never in the future */
const notAfterNow = (iso: string) => (Date.parse(iso) > Date.now() ? new Date(Date.now() - 3_600_000).toISOString() : iso)

// The stages the applications go through, in turn: applied (nobody looked yet), viewed, then the employer's statuses
const STAGES = ["Applied", "viewed", "Shortlisted", "Contacted", "Interview", "Accepted", "Not selected"] as const

const NOTES = [
  "I'd love to bring my experience to your team.",
  "",
  "This role fits what I've been doing for the last few years. Happy to talk any time.",
  "",
  "I live nearby and can start right away.",
]

// Why employers didn't select someone
const REASONS = [
  "We went with a candidate with more years in a similar role.",
  "The position has been filled. Thank you for your interest, and please apply to our future openings.",
  "We needed someone who can start immediately and is based in the city.",
]

const COURSES = [["Google Data Analytics (Coursera)", "Advanced Excel"], ["First aid (Red Crescent)"], ["Project Management Essentials", "Business English B2"]]
const VOLUNTEERING = [["Teaching assistant at a camp school"], ["Red Crescent volunteer"], ["Organised a neighbourhood clean-up"]]
const AWARDS = [["Employee of the month"], ["Top 10% of graduating class"]]
const MARITAL = ["Single", "Married", "Single", "Engaged"]

/** Newer CV parts on the generated job seekers: where each job was, and a few added sections */
export function withNewerCvParts(talent: Talent, user: User | undefined, i: number): Talent {
  const extraSections: Record<string, string[]> = { ...talent.extraSections }
  if (i % 3 === 0) extraSections.courses ??= COURSES[i % COURSES.length]
  if (i % 4 === 1) extraSections.volunteering ??= VOLUNTEERING[i % VOLUNTEERING.length]
  if (i % 5 === 2) extraSections.awards ??= AWARDS[i % AWARDS.length]
  if (i % 2 === 0) extraSections.maritalStatus ??= [MARITAL[i % MARITAL.length]]
  return {
    ...talent,
    experiences: talent.experiences.map((e) => ({ ...e, country: e.country || "IQ", city: e.city || user?.city || "" })),
    extraSections,
  }
}

export type DemoActivity = {
  applications: Application[]
  conversations: Conversation[]
  messages: Message[]
  savedJobs: Saved[]
  follows: Follow[]
  profileViews: ProfileView[]
  notifications: Notification[]
}

/**
 * Each job seeker applies to 2 to 4 jobs (in their own field first), each at a different stage. Employers
 * write to the ones they contacted, called to interview or accepted, and the job seeker answers.
 */
export function demoActivity(seekers: User[], talents: Talent[], jobs: Job[]): DemoActivity {
  const out: DemoActivity = { applications: [], conversations: [], messages: [], savedJobs: [], follows: [], profileViews: [], notifications: [] }
  const open = jobs.filter((j) => j.open)
  if (!open.length) return out

  seekers.forEach((seeker, i) => {
    const field = talents.find((t) => t.userId === seeker.id)?.experiences[0]?.category
    // Their field's jobs first, then others, picked so different people apply to different jobs
    const ranked = [...open.filter((j) => j.category === field), ...open.filter((j) => j.category !== field)]
    const offset = (i * 7) % ranked.length
    const picks = Array.from({ length: Math.min(2 + (i % 3), ranked.length) }, (_, k) => ranked[(offset + k * 3) % ranked.length])
    const first = seeker.name.split(" ")[0]

    new Set(picks).forEach((job) => {
      const k = out.applications.length
      const stage = STAGES[(i + k) % STAGES.length]
      const id = `a-gen-${seeker.id}-${job.id}`
      const applied = notAfterNow(plus(job.createdAt, 1 + (k % 3)))
      const at = (step: number) => notAfterNow(plus(applied, step))
      const status = stage === "Applied" || stage === "viewed" ? "Applied" : stage
      // When it reached each status: every one before it too (the order a real application goes)
      const order = ["Shortlisted", "Contacted", "Interview", stage === "Not selected" ? "Not selected" : "Accepted"]
      const reached = stage === "Not selected" ? ["Not selected"] : order.slice(0, order.indexOf(stage) + 1)
      const statusDates = Object.fromEntries(reached.map((s, n) => [s, at(2 + n * 2)]))
      out.applications.push({
        id,
        jobId: job.id,
        seekerId: seeker.id,
        note: NOTES[k % NOTES.length],
        status,
        createdAt: applied,
        updatedAt: reached.length ? statusDates[reached[reached.length - 1]] : applied,
        ...(stage !== "Applied" && { viewedAt: at(1) }),
        ...(reached.length ? { statusDates } : {}),
        ...(stage === "Not selected" && { rejectionReason: REASONS[k % REASONS.length] }),
      })

      // Not selected: they were told, with the reason
      if (stage === "Not selected") {
        out.notifications.push({ id: `n-gen-${id}`, userId: seeker.id, jobId: job.id, createdAt: statusDates["Not selected"], readAt: null, kind: "rejected", reason: REASONS[k % REASONS.length] })
      }

      // Everyone past pending had their CV opened by the employer: they show in the job seeker's Viewers
      if (stage !== "Applied") {
        const viewId = `${job.employerId}:${seeker.id}`
        const seen = at(1)
        const earlier = out.profileViews.find((v) => v.id === viewId)
        if (!earlier) out.profileViews.push({ id: viewId, seekerId: seeker.id, viewerId: job.employerId, at: seen })
        else if (earlier.at < seen) earlier.at = seen
      }

      // The employer wrote to the ones they contacted, called in or took on; the job seeker answered
      if (stage === "Contacted" || stage === "Interview" || stage === "Accepted") {
        const conversationId = `c-gen-${seeker.id}-${job.id}`
        const started = statusDates.Contacted ?? at(3)
        out.conversations.push({ id: conversationId, employerId: job.employerId, seekerId: seeker.id, jobId: job.id, createdAt: started, updatedAt: notAfterNow(plus(started, 1)) })
        const lines: [string, string][] = [
          [job.employerId, `Hi ${first}, thanks for applying for ${job.title}. We liked your CV. Are you free for a short call this week?`],
          [seeker.id, "Thank you! Yes, any day after 2pm works for me."],
        ]
        if (stage === "Interview") lines.push([job.employerId, "Great. Let's meet at our office on Sunday at 11am for the interview."])
        if (stage === "Accepted") lines.push([job.employerId, `Good news: we'd like to offer you the ${job.title} position. Welcome aboard!`])
        lines.forEach(([senderId, body], n) =>
          out.messages.push({ id: `m-gen-${seeker.id}-${job.id}-${n}`, conversationId, senderId, body, readAt: notAfterNow(plus(started, n * 0.2 + 0.1)), createdAt: notAfterNow(plus(started, n * 0.2)) })
        )
      }
    })

    // A job or two saved for later, and a company followed
    const saved = ranked[(offset + 1) % ranked.length]
    out.savedJobs.push({ userId: seeker.id, id: saved.id, at: notAfterNow(plus(saved.createdAt, 1)) })
    if (i % 2 === 0) {
      const another = ranked[(offset + 5) % ranked.length]
      if (another.id !== saved.id) out.savedJobs.push({ userId: seeker.id, id: another.id, at: notAfterNow(plus(another.createdAt, 2)) })
    }
    out.follows.push({ userId: seeker.id, employerId: ranked[offset].employerId, at: notAfterNow(plus(ranked[offset].createdAt, 1)) })
  })
  return out
}
