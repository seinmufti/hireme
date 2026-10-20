"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { BriefcaseIcon, Building2Icon, ClockIcon, CornerDownLeftIcon, FileTextIcon, SearchIcon, TrendingUpIcon, XIcon } from "lucide-react"
import { useLocationLabel, useT } from "@/i18n/provider"
import type { MessageKey } from "@/i18n/types"
import { companyMatchesQuery, jobMatchesQuery, takesApplications } from "@/lib/jobs"
import { useStore } from "@/lib/store"
import type { Role } from "@/lib/options"
import type { User } from "@/lib/types"
import { cn } from "@/lib/utils"

// A keyword search over everything: the app's pages and CV sections, job listings and companies.
// With nothing typed it offers recent searches (this browser) and popular searches (the skills and job
// categories that come up most in open jobs).

type Item = { key: string; icon: typeof SearchIcon; label: string; detail?: string; href?: string; fill?: string }
type Group = { title: string; items: Item[] }

/** Pages and CV sections, with extra words they can be found by (any language's label also works). */
const PLACES: { key: MessageKey; href: string; words: string; roles?: Role[] }[] = [
  { key: "nav.home", href: "/home", words: "home dashboard overview", roles: ["SEEKER"] },
  { key: "nav.inbox", href: "/inbox", words: "inbox messages chat conversations", roles: ["SEEKER", "EMPLOYER"] },
  { key: "nav.jobs", href: "/jobs", words: "jobs vacancies openings work listings", roles: ["SEEKER", "RECRUITER"] },
  { key: "nav.companies", href: "/companies", words: "companies employers businesses contact" },
  { key: "nav.cvPreview", href: "/profile", words: "cv resume profile details edit", roles: ["SEEKER"] },
  { key: "seeker.previewCv", href: "/profile/cv", words: "cv resume preview download pdf", roles: ["SEEKER"] },
  { key: "nav.pool", href: "/pool", words: "pool candidates talent job seekers", roles: ["EMPLOYER", "RECRUITER"] },
  { key: "applications.myTitle", href: "/jobs/applied", words: "applications applied", roles: ["SEEKER"] },
  { key: "notifications.title", href: "/notifications", words: "notifications alerts matches", roles: ["SEEKER"] },
  { key: "jobs.postJob", href: "/jobs/new", words: "post job new vacancy hire", roles: ["EMPLOYER"] },
  { key: "jobs.myPosts", href: "/jobs/mine", words: "my jobs posts vacancies listings", roles: ["EMPLOYER"] },
  { key: "nav.profile", href: "/profile", words: "profile account settings", roles: ["EMPLOYER", "RECRUITER"] },
  { key: "seeker.sections.personal", href: "/profile?edit=personal", words: "personal contact phone email address photo location", roles: ["SEEKER"] },
  { key: "seeker.sections.about", href: "/profile?edit=about", words: "about summary bio", roles: ["SEEKER"] },
  { key: "seeker.sections.work", href: "/profile?edit=work", words: "work experience jobs employment references", roles: ["SEEKER"] },
  { key: "seeker.sections.education", href: "/profile?edit=education", words: "education degree university college school", roles: ["SEEKER"] },
  { key: "seeker.sections.skills", href: "/profile?edit=skills", words: "skills competencies hard soft", roles: ["SEEKER"] },
  { key: "seeker.sections.languages", href: "/profile?edit=languages", words: "languages english arabic kurdish", roles: ["SEEKER"] },
  { key: "seeker.sections.certifications", href: "/profile?edit=certifications", words: "licenses certifications certificates", roles: ["SEEKER"] },
  { key: "seeker.sections.projects", href: "/profile?edit=projects", words: "projects activities volunteering", roles: ["SEEKER"] },
  { key: "seeker.sections.preference", href: "/jobs", words: "work type remote local international preference", roles: ["SEEKER"] },
]

const RECENT_KEY = "hireme-recent-searches"
const readRecent = (): string[] => {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]")
    return Array.isArray(list) ? list.filter((x) => typeof x === "string").slice(0, 5) : []
  } catch {
    return []
  }
}
const writeRecent = (list: string[]) => {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 5)))
  } catch {}
}

const matchesWords = (text: string, q: string) => {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean)
  const hay = text.toLowerCase()
  return words.every((w) => hay.includes(w))
}

export function GlobalSearch({ user }: { user: User }) {
  const t = useT()
  const router = useRouter()
  const locationLabel = useLocationLabel()
  const jobs = useStore((s) => s.jobs)
  const users = useStore((s) => s.users)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [recent, setRecent] = useState<string[]>([])
  // Phones and tablets: a search icon that opens the search across the top of the screen
  const [expanded, setExpanded] = useState(false)
  const q = query.trim()
  // Employers don't search jobs: they only find their own posts here
  const browsesJobs = user.role !== "EMPLOYER"

  // The skills and categories that come up most in open jobs
  const popular = useMemo(() => {
    const counts = new Map<string, number>()
    for (const j of jobs.filter(takesApplications)) for (const term of [...j.skills, j.category]) counts.set(term, (counts.get(term) ?? 0) + 1)
    return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([term]) => term)
  }, [jobs])

  const groups: Group[] = useMemo(() => {
    if (!q) {
      return [
        { title: t("search.recent"), items: recent.map((r) => ({ key: `r-${r}`, icon: ClockIcon, label: r, fill: r })) },
        { title: t("search.popular"), items: popular.map((p) => ({ key: `p-${p}`, icon: TrendingUpIcon, label: p, fill: p })) },
      ].filter((g) => g.items.length)
    }
    const places = PLACES.filter((p) => !p.roles || p.roles.includes(user.role))
      .filter((p) => matchesWords(`${t(p.key)} ${p.words}`, q))
      .slice(0, 4)
      .map((p) => ({ key: p.href, icon: FileTextIcon, label: t(p.key), href: p.href }))
    const foundJobs = jobs.filter((j) => (browsesJobs ? takesApplications(j) : j.employerId === user.id) && jobMatchesQuery(j, q))
    const jobItems: Item[] = foundJobs.slice(0, 5).map((j) => ({
      key: j.id,
      icon: BriefcaseIcon,
      label: j.title,
      detail: `${j.company} · ${locationLabel(j.location)}`,
      href: `/jobs/${j.id}`,
    }))
    if (browsesJobs && foundJobs.length > 5) {
      jobItems.push({ key: "all-jobs", icon: SearchIcon, label: t("search.allJobsFor", { count: foundJobs.length, q }), href: `/jobs?q=${encodeURIComponent(q)}` })
    }
    const companies = users
      .filter((u) => u.role === "EMPLOYER" && companyMatchesQuery(u, q))
      .slice(0, 3)
      .map((c) => ({ key: c.id, icon: Building2Icon, label: c.company || c.name, detail: c.city, href: `/companies/${c.id}` }))
    return [
      { title: t("search.pages"), items: places },
      { title: t("search.jobs"), items: jobItems },
      { title: t("search.companies"), items: companies },
    ].filter((g) => g.items.length)
  }, [q, recent, popular, jobs, users, user.role, user.id, browsesJobs, t, locationLabel])

  const items = groups.flatMap((g) => g.items)

  const remember = (term: string) => {
    const next = [term, ...readRecent().filter((r) => r.toLowerCase() !== term.toLowerCase())]
    writeRecent(next)
    setRecent(next.slice(0, 5))
  }

  const choose = (item: Item | undefined) => {
    // Enter with nothing picked: all jobs for the words typed
    if (!item) {
      if (!q || !browsesJobs) return
      item = { key: "all", icon: SearchIcon, label: q, href: `/jobs?q=${encodeURIComponent(q)}` }
    }
    if (item.fill) {
      setQuery(item.fill)
      setActive(0)
      return
    }
    if (q) remember(q)
    setOpen(false)
    setExpanded(false)
    setQuery("")
    router.push(item.href!)
  }

  return (
    <>
    <button
      type="button"
      onClick={() => setExpanded(true)}
      aria-label={t("search.label")}
      className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground lg:hidden"
    >
      <SearchIcon className="size-5" />
    </button>
    <div
      className={cn(
        "lg:relative lg:block lg:w-64",
        expanded ? "fixed inset-x-0 top-0 z-50 flex h-14 items-center gap-2 border-b bg-card px-4 sm:px-6" : "hidden"
      )}
    >
      <div className="relative min-w-0 flex-1">
      <SearchIcon className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        // Opened from the search icon: ready to type
        ref={(el) => {
          if (el && expanded && document.activeElement !== el && window.innerWidth < 1024) el.focus()
        }}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => {
          setRecent(readRecent())
          setOpen(true)
        }}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setActive((i) => Math.min(i + 1, items.length - 1))
          else if (e.key === "ArrowUp") setActive((i) => Math.max(i - 1, 0))
          else if (e.key === "Enter") choose(items[active])
          else if (e.key === "Escape") {
            setOpen(false)
            setExpanded(false)
          }
          else return
          e.preventDefault()
        }}
        placeholder={t("search.placeholder")}
        aria-label={t("search.label")}
        role="combobox"
        aria-expanded={open}
        aria-controls="global-search-results"
        className="h-9 w-full rounded-full border bg-background ps-8 pe-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
      />
      </div>
      <button
        type="button"
        onClick={() => {
          setExpanded(false)
          setOpen(false)
        }}
        aria-label={t("common.close")}
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted lg:hidden"
      >
        <XIcon className="size-5" />
      </button>
      {open && (
        <div
          id="global-search-results"
          role="listbox"
          // Keeps the input focused (and the list open) while clicking inside it
          onMouseDown={(e) => e.preventDefault()}
          className="fixed inset-x-0 top-14 z-50 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b bg-popover p-1 shadow-lg lg:absolute lg:inset-x-auto lg:end-0 lg:top-11 lg:max-h-[min(30rem,calc(100dvh-8rem))] lg:w-96 lg:rounded-xl lg:border"
        >
          {groups.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {q ? t("search.noResults", { q }) : t("search.hint")}
            </p>
          )}
          {groups.map((g) => (
            <div key={g.title} className="py-1">
              <div className="flex items-center justify-between px-2.5 pt-1 pb-1">
                <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{g.title}</span>
                {g.title === t("search.recent") && (
                  <button
                    type="button"
                    onClick={() => {
                      writeRecent([])
                      setRecent([])
                    }}
                    className="text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    {t("search.clear")}
                  </button>
                )}
              </div>
              {g.items.map((item) => {
                const i = items.indexOf(item)
                return (
                  <button
                    key={item.key}
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(item)}
                    className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-start text-sm", i === active && "bg-muted")}
                  >
                    <item.icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{item.label}</span>
                      {item.detail && <span className="block truncate text-xs text-muted-foreground">{item.detail}</span>}
                    </span>
                    {i === active && <CornerDownLeftIcon className="size-3.5 shrink-0 text-muted-foreground" />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  )
}
