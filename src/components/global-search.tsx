"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BriefcaseIcon, Building2Icon, FileTextIcon, SearchIcon, UserIcon } from "lucide-react"
import { useT } from "@/i18n/provider"
import type { User } from "@/lib/types"
import { cn } from "@/lib/utils"

type Result = { key: string; icon: typeof SearchIcon; label: string; href: string }

/**
 * One search box for everything: jobs and companies (their pages filter by ?q=), and for job seekers
 * their own profile and CV. Enter opens the first result.
 */
export function GlobalSearch({ user }: { user: User }) {
  const t = useT()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const q = query.trim()
  const enc = encodeURIComponent(q)

  const results: Result[] = [
    q
      ? { key: "jobs", icon: BriefcaseIcon, label: t("search.jobsFor", { q }), href: `/jobs?q=${enc}` }
      : { key: "jobs", icon: BriefcaseIcon, label: t("search.allJobs"), href: "/jobs" },
    q
      ? { key: "companies", icon: Building2Icon, label: t("search.companiesFor", { q }), href: `/companies?q=${enc}` }
      : { key: "companies", icon: Building2Icon, label: t("search.allCompanies"), href: "/companies" },
  ]
  if (user.role === "SEEKER") {
    // Your own profile shows when the box is empty, or when what's typed fits your name, "profile" or "CV"
    const own = !q || [user.name, "profile", "cv", t("search.yourProfile"), t("search.yourCv")].some((s) => s.toLowerCase().includes(q.toLowerCase()))
    if (own) {
      results.push(
        { key: "profile", icon: UserIcon, label: t("search.yourProfile"), href: "/profile" },
        { key: "cv", icon: FileTextIcon, label: t("search.yourCv"), href: "/profile/cv" }
      )
    }
  }

  const go = (r: Result | undefined) => {
    if (!r) return
    setOpen(false)
    setQuery("")
    router.push(r.href)
  }

  return (
    <div className="relative w-64">
      <SearchIcon className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setActive((i) => Math.min(i + 1, results.length - 1))
          else if (e.key === "ArrowUp") setActive((i) => Math.max(i - 1, 0))
          else if (e.key === "Enter") go(results[active])
          else if (e.key === "Escape") setOpen(false)
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
      {open && (
        <div
          id="global-search-results"
          role="listbox"
          className="absolute start-0 top-11 z-50 w-80 overflow-hidden rounded-xl border bg-popover p-1 shadow-lg"
        >
          {results.map((r, i) => (
            <button
              key={r.key}
              type="button"
              role="option"
              aria-selected={i === active}
              // Before the input's blur closes the list
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(r)}
              className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-sm", i === active && "bg-muted")}
            >
              <r.icon className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{r.label}</span>
            </button>
          ))}
          {!q && <p className="border-t px-2.5 pt-2 pb-1.5 text-xs text-muted-foreground">{t("search.hint")}</p>}
        </div>
      )}
    </div>
  )
}
