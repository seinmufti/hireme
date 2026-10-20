"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { BriefcaseIcon, MailIcon, MapPinIcon, PhoneIcon, SearchIcon } from "lucide-react"
import { UserAvatar } from "@/components/user-avatar"
import { Input } from "@/components/ui/input"
import { useT } from "@/i18n/provider"
import { companyMatchesQuery } from "@/lib/jobs"
import { useStore } from "@/lib/store"
import { useRoleGuard } from "@/lib/use-role-guard"

// Every employer on HireMe with their contact details and open jobs.
export function CompaniesView({ initialQuery }: { initialQuery: string }) {
  const viewer = useRoleGuard()
  const t = useT()
  const users = useStore((s) => s.users)
  const jobs = useStore((s) => s.jobs)
  const [query, setQuery] = useState(initialQuery)
  const companies = useMemo(
    () => users.filter((u) => u.role === "EMPLOYER").sort((a, b) => (a.company || a.name).localeCompare(b.company || b.name)),
    [users]
  )
  const results = companies.filter((c) => companyMatchesQuery(c, query))
  const openJobs = (id: string) => jobs.filter((j) => j.employerId === id && j.open).length

  const setSearch = (q: string) => {
    setQuery(q)
    // Keep the address in step, so the search can be shared or reloaded
    window.history.replaceState(null, "", q.trim() ? `/companies?q=${encodeURIComponent(q.trim())}` : "/companies")
  }

  if (!viewer) return null

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("companies.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("companies.count", { count: companies.length })}
          </p>
        </div>
        <div className="relative w-80">
          <SearchIcon className="pointer-events-none absolute top-1/2 start-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setSearch(e.target.value)} placeholder={t("companies.searchPlaceholder")} className="h-8 ps-8" aria-label={t("companies.searchLabel")} />
        </div>
      </div>

      {results.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card py-16 text-center">
          <p className="font-medium">{t("companies.noResults")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("companies.noResultsHint")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
          {results.map((c) => {
            const count = openJobs(c.id)
            return (
              <article key={c.id} className="relative flex flex-col rounded-xl border bg-card p-5 shadow-xs transition hover:border-primary/30 hover:shadow-sm">
                <div className="flex items-start gap-3">
                  <UserAvatar name={c.company || c.name} color={c.avatarColor} size={44} />
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">
                      <Link href={`/companies/${c.id}`} className="after:absolute after:inset-0 hover:underline">
                        {c.company || c.name}
                      </Link>
                    </h3>
                    <p className="truncate text-sm text-muted-foreground">
                      {c.name}
                      {c.title && ` · ${c.title}`}
                    </p>
                  </div>
                </div>
                {c.bio && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{c.bio}</p>}
                <dl className="mt-4 space-y-1.5 text-sm">
                  {c.city && (
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="size-3.5 shrink-0 text-muted-foreground" />
                      <dt className="sr-only">{t("companies.city")}</dt>
                      <dd>{c.city}</dd>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-2">
                      <MailIcon className="size-3.5 shrink-0 text-muted-foreground" />
                      <dt className="sr-only">{t("companies.email")}</dt>
                      <dd className="truncate">{c.email}</dd>
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="size-3.5 shrink-0 text-muted-foreground" />
                      <dt className="sr-only">{t("companies.phone")}</dt>
                      <dd>{c.phone}</dd>
                    </div>
                  )}
                </dl>
                <p className="mt-auto flex items-center gap-1.5 pt-4 text-sm font-medium">
                  <BriefcaseIcon className="size-3.5 text-muted-foreground" />
                  {count ? (count === 1 ? t("companies.openJobsOne") : t("companies.openJobs", { count })) : <span className="font-normal text-muted-foreground">{t("companies.noOpenJobs")}</span>}
                </p>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
