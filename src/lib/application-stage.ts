import type { Application, Conversation, Job } from "@/lib/types"

/**
 * Where an application stands, as the job seeker sees it (their Applications board), from what the
 * employer did: set a status, opened the CV (viewedAt) or messaged them about it.
 */
export const SEEKER_STAGES = ["pending", "viewed", "shortlisted", "contacted", "interview", "accepted", "rejected"] as const
export type SeekerStage = (typeof SEEKER_STAGES)[number]

export function seekerStage(application: Application, job: Pick<Job, "id" | "employerId"> | undefined, conversations: Conversation[]): SeekerStage {
  const status = application.status
  if (status === "Not selected") return "rejected"
  if (status === "Accepted") return "accepted"
  if (status === "Interview") return "interview"
  // The employer wrote to them about this job (or, in older conversations without a job, at all)
  const messaged =
    !!job &&
    conversations.some((c) => c.employerId === job.employerId && c.seekerId === application.seekerId && (!c.jobId || c.jobId === job.id))
  if (status === "Contacted" || messaged) return "contacted"
  if (status === "Shortlisted") return "shortlisted"
  if (application.viewedAt) return "viewed"
  return "pending"
}
