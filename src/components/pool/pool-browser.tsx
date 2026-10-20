"use client"

import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { useMemo, useState } from "react"
import { BookmarkIcon, EyeIcon, SearchIcon, UsersIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { type Role } from "@/lib/options"
import { useT } from "@/i18n/provider"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { applyFilters, buildFilters, labelFor, optionCounts, type FilterState, type PoolTalent } from "@/lib/filters"
import { FilterDropdown } from "./filter-dropdown"
import { MessageDialog, type Sender } from "./message-dialog"
import { TalentCard } from "./talent-card"
import { TalentProfileDialog } from "./talent-profile-dialog"

const SORTS = [
  { value: "recent", key: "pool.sortRecent" },
  { value: "exp-desc", key: "pool.sortMostExp" },
  { value: "exp-asc", key: "pool.sortLeastExp" },
] as const

export function PoolBrowser({
  talents,
  viewer,
}: {
  talents: PoolTalent[]
  viewer: Sender & { role: Role }
}) {
  const t = useT()
  const sorts = SORTS.map((s) => ({ value: s.value, label: t(s.key) }))
  const canMessage = viewer.role === "EMPLOYER"
  const defs = useMemo(() => buildFilters(talents), [talents])
  const [state, setState] = useState<FilterState>({})
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState("recent")
  const [profileId, setProfileId] = useState<string | null>(null)
  const [messageId, setMessageId] = useState<string | null>(null)
  // Only the job seekers this employer or recruiter saved
  const [onlySaved, setOnlySaved] = useState(false)
  const savedIds = useStore((s) => s.savedTalents.filter((x) => x.userId === s.currentUserId).map((x) => x.id).join(" "))

  const results = useMemo(() => {
    const list = applyFilters(talents, defs, state, query).filter((x) => !onlySaved || savedIds.split(" ").includes(x.id))
    const by: Record<string, (a: PoolTalent, b: PoolTalent) => number> = {
      recent: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
      "exp-desc": (a, b) => b.totalMonths - a.totalMonths,
      "exp-asc": (a, b) => a.totalMonths - b.totalMonths,
    }
    return [...list].sort(by[sort])
  }, [talents, defs, state, query, sort, onlySaved, savedIds])

  const active = defs.flatMap((d) =>
    (state[d.key] ?? []).map((v) => ({ def: d, value: v, label: labelFor(d, v) }))
  )
  const hasFilters = active.length > 0 || query.trim() !== "" || onlySaved
  const byId = (id: string | null) => talents.find((t) => t.id === id) ?? null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("pool.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {talents.length === 1 ? t("pool.sharedOne") : t("pool.shared", { count: talents.length })}
          </p>
        </div>
        {!canMessage && (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm text-muted-foreground">
            <EyeIcon className="size-4" /> {t("pool.readOnly", { role: t(`roles.${viewer.role}`) })}
          </div>
        )}
      </div>

      <div className="z-30 -mx-4 space-y-3 border-b bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:sticky lg:top-14 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-80">
            <SearchIcon className="pointer-events-none absolute top-1/2 start-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("pool.searchPlaceholder")}
              className="h-8 ps-8"
            />
          </div>
          <div className="ms-auto flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t("common.sort")}</span>
            <Select items={sorts} value={sort} onValueChange={(v) => v && setSort(v)}>
              <SelectTrigger size="sm" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sorts.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={onlySaved}
            onClick={() => setOnlySaved((v) => !v)}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-sm transition",
              onlySaved ? "border-primary/40 bg-brand-soft text-foreground" : "hover:bg-muted"
            )}
          >
            <BookmarkIcon className={cn("size-3.5", onlySaved && "fill-current text-primary")} /> {t("common.savedForLater")}
          </button>
          {defs.map((def) => (
            <FilterDropdown
              key={def.key}
              def={def}
              selected={state[def.key] ?? []}
              counts={optionCounts(talents, defs, def, state, query)}
              onChange={(values) => setState((s) => ({ ...s, [def.key]: values }))}
            />
          ))}
        </div>

        {hasFilters && (
          <div className="flex flex-wrap items-center gap-1.5">
            {active.map(({ def, value, label }) => (
              <button
                key={def.key + value}
                type="button"
                onClick={() => setState((s) => ({ ...s, [def.key]: (s[def.key] ?? []).filter((v) => v !== value) }))}
                className="flex items-center gap-1 rounded-full border bg-card py-0.5 pe-1.5 ps-2.5 text-xs hover:bg-muted"
              >
                <span className="text-muted-foreground">{t.dynamic(`pool.filters.${def.key}`, def.label)}:</span> {label}
                <XIcon className="size-3 text-muted-foreground" />
              </button>
            ))}
            <Button variant="link" size="xs" onClick={() => { setState({}); setQuery("") }}>
              {t("common.clearAll")}
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <UsersIcon className="size-4" />
        <span>
          {t("pool.matchCount", { count: results.length, total: talents.length })}
        </span>
      </div>

      {results.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card py-16 text-center">
          <p className="font-medium">{t("pool.noMatch")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((t) => (
            <TalentCard
              key={t.id}
              talent={t}
              canMessage={canMessage}
              onOpen={() => setProfileId(t.id)}
              onMessage={() => setMessageId(t.id)}
            />
          ))}
        </div>
      )}

      <TalentProfileDialog
        talent={byId(profileId)}
        open={profileId !== null}
        onOpenChange={(o) => !o && setProfileId(null)}
        canMessage={canMessage}
        onMessage={() => {
          setMessageId(profileId)
          setProfileId(null)
        }}
      />
      {canMessage && (
        <MessageDialog
          talent={byId(messageId)}
          sender={viewer}
          open={messageId !== null}
          onOpenChange={(o) => !o && setMessageId(null)}
        />
      )}
    </div>
  )
}
