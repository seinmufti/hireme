"use client"

import Link from "next/link"
import { BriefcaseIcon, Building2Icon, GlobeIcon, MapPinIcon, WifiIcon } from "lucide-react"
import { useT } from "@/i18n/provider"
import { timeAgo } from "@/lib/format"
import { matchJobs, useJobs, type HomeJob, type HomeTalent } from "./home-data"

const SHOWN = 6

/** Under the CV on Home: how many jobs match the job seeker, and the best of them. */
export function JobMatches({ talent }: { talent: HomeTalent | null }) {
  const t = useT()
  const jobs = useJobs()
  const matches = matchJobs(talent, jobs)

  return (
    <section className="rounded-xl border bg-card">
      <div className="flex items-center gap-3 border-b px-5 py-4">
        <span className="flex size-10 items-center justify-center rounded-lg bg-brand-soft text-primary">
          <BriefcaseIcon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">{t("home.matchingJobs")}</h2>
          <p className="text-sm text-muted-foreground">
            {matches.length === 1 ? t("home.matchingOne") : t("home.matchingCount", { count: matches.length })}
          </p>
        </div>
        <Link href="/jobs" className="shrink-0 text-sm font-medium text-primary hover:underline">
          {t("home.seeAll")}
        </Link>
      </div>

      {matches.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">{jobs.length ? t("home.noJobs") : t("home.jobsSoon")}</p>
      ) : (
        <ul className="divide-y">
          {matches.slice(0, SHOWN).map((job) => (
            <JobRow key={job.id} job={job} />
          ))}
        </ul>
      )}
    </section>
  )
}

function JobRow({ job }: { job: HomeJob }) {
  const t = useT()
  const where = [
    job.location?.remote && { icon: WifiIcon, text: t("home.remote") },
    job.location?.international && { icon: GlobeIcon, text: t("home.international") },
    job.location?.iraqCity && { icon: MapPinIcon, text: job.location.iraqCity },
  ].filter(Boolean) as { icon: typeof MapPinIcon; text: string }[]

  return (
    <li>

      <Link href={`/jobs/${job.id}`} className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-muted/50">
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{job.title}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Building2Icon className="size-3.5" />
              {job.company}
            </span>
            {where.map((w) => (
              <span key={w.text} className="flex items-center gap-1">
                <w.icon className="size-3.5" />
                {w.text}
              </span>
            ))}
            {job.contractType && <span>{job.contractType}</span>}
          </div>
          {!!job.skills?.length && (
            <ul className="mt-2 flex flex-wrap gap-1">
              {job.skills.slice(0, 5).map((s) => (
                <li key={s} className="rounded-full bg-muted px-2 py-0.5 text-[11px]">
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
        {job.createdAt && <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(job.createdAt)}</span>}
      </Link>
    </li>
  )
}
