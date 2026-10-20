"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { BriefcaseIcon, PlusIcon, SearchIcon, SendIcon, SparklesIcon, XIcon } from "lucide-react"
import { FilterDropdown } from "@/components/pool/filter-dropdown"
import { useT } from "@/i18n/provider"
import type { Translate } from "@/i18n/translate"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { JOB_CITIES, jobMatchesQuery, locationValue, takesApplications } from "@/lib/jobs"
import { matchingJobs, type MatchableTalent } from "@/lib/matching"
import { CONTRACT_TYPES, JOB_CATEGORIES, type Role } from "@/lib/options"
import { useStore } from "@/lib/store"
import type { Job } from "@/lib/types"
import { cn } from "@/lib/utils"
import { JobCard } from "./job-card"

type Key = "category" | "location" | "contract"
type Def = {
  key: Key
  label: string
  mode: "any"
  options: { value: string; label: string }[]
  pinned?: { title: string; values: string[] }
  value: (j: Job) => string
}
type State = Partial<Record<Key, string[]>>

const plain = (list: string[]) => list.map((v) => ({ value: v, label: v }))
// The standard list, plus anything jobs use that isn't on it
const withExtras = (base: string[], values: string[]) => [...base, ...[...new Set(values)].filter((v) => !base.includes(v)).sort()]

function buildDefs(jobs: Job[], t: Translate): Def[] {
  const cities = jobs.map((j) => j.location.iraqCity).filter(Boolean)
  return [
    {
      key: "category",
      label: t("jobs.filterCategory"),
      mode: "any",
      options: plain(withExtras(JOB_CATEGORIES, jobs.map((j) => j.category))),
      value: (j) => j.category,
    },
    {
      key: "location",
      label: t("jobs.filterLocation"),
      mode: "any",
      pinned: { title: t("jobs.remoteAbroad"), values: ["Remote", "International"] },
      options: [
        { value: "Remote", label: t("jobs.remote") },
        { value: "International", label: t("jobs.international") },
        ...plain(withExtras(JOB_CITIES, cities)),
      ],
      value: (j) => locationValue(j.location),
    },
    { key: "contract", label: t("jobs.filterContract"), mode: "any", options: plain(CONTRACT_TYPES), value: (j) => j.contractType },
  ]
}

const passes = (j: Job, defs: Def[], state: State) => defs.every((d) => !state[d.key]?.length || state[d.key]!.includes(d.value(j)))


/**
 * Job search: keyword search ("sales" finds every sales job), filters and, for job seekers,
 * the jobs that match their profile. `initialQuery` comes from the address (?q=).
 */
export function JobBrowser({
  jobs,
  role,
  talent,
  initialQuery,
}: {
  jobs: Job[]
  role: Role
  talent: MatchableTalent | null
  initialQuery: string
}) {
  const t = useT()
  const isSeeker = role === "SEEKER"
  const SORTS = [
    { value: "match", label: t("jobs.sortBest") },
    { value: "recent", label: t("jobs.sortNewest") },
  ]
  const open = useMemo(() => jobs.filter(takesApplications), [jobs])
  const defs = useMemo(() => buildDefs(open, t), [open, t])
  const [state, setState] = useState<State>({})
  const [query, setQuery] = useState(initialQuery)
  const [onlyMatches, setOnlyMatches] = useState(false)
  const [sort, setSort] = useState(isSeeker ? "match" : "recent")

  const matches = useMemo(() => (talent ? matchingJobs(talent, open) : []), [talent, open])
  const score = useMemo(() => new Map(matches.map((m) => [m.job.id, m.score])), [matches])
  const have = [...(talent?.hardSkills ?? []), ...(talent?.softSkills ?? [])]
  // The signed-in job seeker's applications, by job
  const userId = useStore((s) => s.currentUserId)
  const allApplications = useStore((s) => s.applications)
  const applied = useMemo(
    () => new Map(allApplications.filter((a) => a.seekerId === userId).map((a) => [a.jobId, a.status])),
    [allApplications, userId]
  )

  const setSearch = (q: string) => {
    setQuery(q)
    // Keep the address in step, so the search can be shared or reloaded
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
    window.history.replaceState(null, "", q.trim() ? `${base}/jobs?q=${encodeURIComponent(q.trim())}` : `${base}/jobs`)
  }

  const base = useMemo(
    () => open.filter((j) => jobMatchesQuery(j, query) && (!onlyMatches || score.has(j.id))),
    [open, query, onlyMatches, score]
  )
  const results = useMemo(() => {
    const list = base.filter((j) => passes(j, defs, state))
    const recent = (a: Job, b: Job) => b.createdAt.localeCompare(a.createdAt)
    return [...list].sort(sort === "match" ? (a, b) => (score.get(b.id) ?? 0) - (score.get(a.id) ?? 0) || recent(a, b) : recent)
  }, [base, defs, state, sort, score])

  // For each option: how many jobs would show if it were picked, given the other filters
  const countsFor = (def: Def) => {
    const others = base.filter((j) => passes(j, defs, { ...state, [def.key]: undefined }))
    const counts = new Map<string, number>()
    for (const o of def.options) counts.set(o.value, others.filter((j) => def.value(j) === o.value).length)
    return counts
  }

  const active = defs.flatMap((d) => (state[d.key] ?? []).map((v) => ({ def: d, value: v })))
  const hasFilters = active.length > 0 || query.trim() !== "" || onlyMatches

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("jobs.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {open.length === 1 ? t("jobs.openOne") : t("jobs.openCount", { count: open.length })}
            {isSeeker && talent && <> · {t("jobs.matchProfile", { count: matches.length })}</>}
          </p>
        </div>
        {isSeeker && (
          <Link href="/jobs/applied" className={buttonVariants({ variant: "outline" })}>
            <SendIcon /> {t("jobs.myApplications")}
            {applied.size > 0 && <span className="text-muted-foreground">{applied.size}</span>}
          </Link>
        )}
        {role === "EMPLOYER" && (
          <div className="flex gap-2">
            <Link href="/jobs/mine" className={buttonVariants({ variant: "outline" })}>
              <BriefcaseIcon /> {t("jobs.myPosts")}
            </Link>
            <Link href="/jobs/new" className={buttonVariants()}>
              <PlusIcon /> {t("jobs.postJob")}
            </Link>
          </div>
        )}
      </div>

      <div className="sticky top-14 z-30 -mx-8 space-y-3 border-b bg-background/95 px-8 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="relative w-96">
            <SearchIcon className="pointer-events-none absolute top-1/2 start-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("jobs.searchPlaceholder")}
              className="h-8 ps-8"
              aria-label={t("jobs.searchLabel")}
            />
          </div>
          {isSeeker && talent && (
            <button
              type="button"
              aria-pressed={onlyMatches}
              onClick={() => setOnlyMatches((v) => !v)}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-sm transition",
                onlyMatches ? "border-emerald-400 bg-emerald-50 text-emerald-900" : "hover:bg-muted"
              )}
            >
              <SparklesIcon className="size-3.5" /> {t("jobs.matchingMine")}
              <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums">{matches.length}</span>
            </button>
          )}
          <div className="ms-auto flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t("common.sort")}</span>
            <Select items={isSeeker ? SORTS : SORTS.slice(1)} value={sort} onValueChange={(v) => v && setSort(v)}>
              <SelectTrigger size="sm" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(isSeeker ? SORTS : SORTS.slice(1)).map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {defs.map((def) => (
            <FilterDropdown
              key={def.key}
              def={def}
              countLabel={t("jobs.countLabel")}
              selected={state[def.key] ?? []}
              counts={countsFor(def)}
              onChange={(values) => setState((s) => ({ ...s, [def.key]: values }))}
            />
          ))}
        </div>

        {hasFilters && (
          <div className="flex flex-wrap items-center gap-1.5">
            {active.map(({ def, value }) => (
              <button
                key={def.key + value}
                type="button"
                onClick={() => setState((s) => ({ ...s, [def.key]: (s[def.key] ?? []).filter((v) => v !== value) }))}
                className="flex items-center gap-1 rounded-full border bg-card py-0.5 ps-2.5 pe-1.5 text-xs hover:bg-muted"
              >
                <span className="text-muted-foreground">{def.label}:</span> {def.options.find((o) => o.value === value)?.label ?? value}
                <XIcon className="size-3 text-muted-foreground" />
              </button>
            ))}
            <Button
              variant="link"
              size="xs"
              onClick={() => {
                setState({})
                setSearch("")
                setOnlyMatches(false)
              }}
            >
              {t("common.clearAll")}
            </Button>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        {t("jobs.resultCount", { shown: results.length, total: open.length })}
        {query.trim() && <> {t("jobs.resultFor", { q: query.trim() })}</>}
      </p>

      {results.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card py-16 text-center">
          <p className="font-medium">{t("jobs.noResults")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("jobs.noResultsHint")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
          {results.map((j) => (
            <JobCard key={j.id} job={j} match={isSeeker && score.has(j.id)} have={have} applied={applied.get(j.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
