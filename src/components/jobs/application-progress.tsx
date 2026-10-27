"use client"

import { CheckIcon, XIcon } from "lucide-react"
import { useI18n, useT } from "@/i18n/provider"
import type { SeekerStage } from "@/lib/application-stage"
import type { Application, Conversation } from "@/lib/types"
import { cn } from "@/lib/utils"

// An application's progress from applied to accepted, with when each step happened: on the job seeker's
// Applications page and the employer's applicants.

/** The steps an application goes through, in order (rejected can come after any of them) */
const STEPS: SeekerStage[] = ["pending", "viewed", "shortlisted", "contacted", "interview", "accepted"]

/** When each step happened, as far as it's known (steps the employer skipped have none) */
function stepDates(application: Application, thread: Conversation | undefined): Partial<Record<SeekerStage, string>> {
  const d = application.statusDates ?? {}
  return {
    pending: application.createdAt,
    viewed: application.viewedAt,
    shortlisted: d.Shortlisted,
    contacted: d.Contacted ?? thread?.createdAt,
    interview: d.Interview,
    accepted: d.Accepted,
    rejected: d["Not selected"],
  }
}

/**
 * The steps from applied to accepted, each with the date it happened: done ones filled, the current one
 * ringed, the rest grey. A rejected application ends in a red cross after the last step it reached.
 */
export function ApplicationProgress({ stage, application, thread }: { stage: SeekerStage; application: Application; thread: Conversation | undefined }) {
  const t = useT()
  const { locale } = useI18n()
  const dates = stepDates(application, thread)
  const lang = locale === "en" ? "en-GB" : locale
  const day = (iso?: string) => (iso ? new Date(iso).toLocaleDateString(lang, { day: "numeric", month: "short" }) : "")
  const time = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" }) : "")
  const rejected = stage === "rejected"
  // Rejected: after the last step that has a date (at least applied)
  const reached = rejected ? Math.max(0, ...STEPS.slice(0, -1).map((s, i) => (dates[s] ? i : 0))) : STEPS.indexOf(stage)
  const steps = rejected ? [...STEPS.slice(0, reached + 1), "rejected" as const] : STEPS
  // The first step reads "Applied", with the date they applied
  const label = (step: SeekerStage) => (step === "pending" ? t("applications.statusApplied") : t(`applications.stages.${step}`))
  return (
    <>
      <ol className="mt-4 flex items-start">
        {steps.map((step, i) => {
          const done = i < reached || (step === "accepted" && stage === "accepted")
          const current = i === reached && !done
          const isRejected = step === "rejected"
          const when = done || current || isRejected ? dates[step] : undefined
          return (
            <li key={step} className="relative flex flex-1 flex-col items-center text-center">
              {/* The line to the next step */}
              {i < steps.length - 1 && (
                <span className={cn("absolute start-1/2 top-2.5 h-0.5 w-full", i < reached ? "bg-emerald-500" : "bg-border")} aria-hidden />
              )}
              <span
                className={cn(
                  "relative flex size-5 items-center justify-center rounded-full",
                  isRejected ? "bg-red-500 text-white" : done ? "bg-emerald-500 text-white" : current ? "border-2 border-primary bg-card" : "border-2 border-border bg-card"
                )}
              >
                {isRejected ? <XIcon className="size-3" /> : done ? <CheckIcon className="size-3" /> : null}
              </span>
              <span
                className={cn(
                  "mt-1.5 hidden px-1 text-[11px] leading-tight sm:block",
                  isRejected ? "font-medium text-red-600" : current ? "font-medium text-foreground" : done ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {label(step)}
              </span>
              {/* When it happened: the day, and the time under it */}
              {when && (
                <span className="hidden text-[11px] leading-tight text-muted-foreground tabular-nums sm:block">
                  {day(when)}
                  <br />
                  {time(when)}
                </span>
              )}
            </li>
          )
        })}
      </ol>
      {/* Phones: no room under the dots, so each step that happened is listed with its day and time */}
      <ul className="mt-3 space-y-1 text-xs sm:hidden">
        {steps
          .filter((step) => dates[step])
          .map((step) => (
            <li key={step} className="flex justify-between gap-3">
              <span className={cn("font-medium", step === "rejected" && "text-red-600")}>{label(step)}</span>
              <span className="text-muted-foreground tabular-nums">
                {day(dates[step])}, {time(dates[step])}
              </span>
            </li>
          ))}
      </ul>
    </>
  )
}
