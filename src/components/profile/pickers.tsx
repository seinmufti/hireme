"use client"

import { useEffect, useState } from "react"
import { CheckIcon, ChevronDownIcon, ListIcon, LoaderCircleIcon, PencilLineIcon, SearchIcon } from "lucide-react"
import { Flag } from "@/components/cv/photo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { COUNTRIES, IRAQ_CITIES } from "@/lib/options"
import { cn } from "@/lib/utils"

// Pickers for a country's cities and institutions: choose from a searchable list, or (only when nothing
// in the list matches) write your own.

type ListState = { items: string[]; loading: boolean }

/** Searchable list in a popover, or "Other" (only when nothing matches) to write your own. */
function SearchablePicker({
  list,
  value,
  onChange,
  labels,
}: {
  list: ListState
  value: string
  onChange: (v: string) => void
  labels: { choose: string; search: string; loading: string; none: string; write: string }
}) {
  const { items, loading } = list
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  // Chosen "Other", or a saved value that isn't in the list (only known once the list has loaded)
  const [custom, setCustom] = useState(false)
  const writing = custom || (!loading && !!value && !items.includes(value))
  const q = query.trim().toLowerCase()
  const matches = items.filter((c) => !q || c.toLowerCase().includes(q)).slice(0, 200)
  const pick = (item: string) => {
    onChange(item)
    setOpen(false)
  }

  if (writing) {
    return (
      <div className="flex gap-1.5">
        <Input className="h-9" value={value} onChange={(e) => onChange(e.target.value)} placeholder={labels.write} autoFocus={custom} />
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          title="Choose from the list"
          aria-label="Choose from the list"
          onClick={() => {
            setCustom(false)
            onChange("")
          }}
        >
          <ListIcon />
        </Button>
      </div>
    )
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setQuery("")
      }}
    >
      <PopoverTrigger
        render={
          <button
            type="button"
            className="flex h-9 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent pr-2 pl-2.5 text-left text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        }
      >
        <span className={cn("truncate", !value && "text-muted-foreground")}>{value || labels.choose}</span>
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" collisionAvoidance={{ fallbackAxisSide: "none" }} className="w-80 gap-0 p-0">
        <div className="flex items-center gap-2 border-b px-3">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                if (matches[0]) pick(matches[0])
              }
            }}
            placeholder={labels.search}
            className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoFocus
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {loading && (
            <p className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
              <LoaderCircleIcon className="size-4 animate-spin" /> {labels.loading}
            </p>
          )}
          {!loading && matches.length === 0 && <p className="px-3 py-4 text-center text-sm text-muted-foreground">{labels.none}</p>}
          {matches.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => pick(item)}
              className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
            >
              {item}
              {item === value && <CheckIcon className="size-4 shrink-0 text-primary" />}
            </button>
          ))}
        </div>
        {/* Only offered when the list has no match at all */}
        {!loading && matches.length === 0 && (
          <div className="border-t p-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setCustom(true)
                onChange(query.trim())
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
            >
              <PencilLineIcon className="size-4 text-muted-foreground" />
              {q ? <>Other: write &ldquo;{query.trim()}&rdquo;</> : "Other (write your own)"}
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

/** Cities of a country, loaded when first needed (the full list is large). Iraq uses the curated list. */
const cityCache = new Map<string, string[]>()
function useCities(country: string): ListState {
  const [loaded, setLoaded] = useState<{ country: string; cities: string[] } | null>(null)
  useEffect(() => {
    if (country === "IQ" || cityCache.has(country)) return
    let cancelled = false
    import("country-state-city/lib/city")
      .then(({ default: City }) => {
        const names = [...new Set((City.getCitiesOfCountry(country) ?? []).map((c) => c.name))].sort((x, y) => x.localeCompare(y))
        cityCache.set(country, names)
        if (!cancelled) setLoaded({ country, cities: names })
      })
      .catch(() => !cancelled && setLoaded({ country, cities: [] }))
    return () => {
      cancelled = true
    }
  }, [country])
  if (country === "IQ") return { items: IRAQ_CITIES, loading: false }
  const cached = cityCache.get(country)
  if (cached) return { items: cached, loading: false }
  return loaded?.country === country ? { items: loaded.cities, loading: false } : { items: [], loading: true }
}

/** The country's cities, or "Other" to write your own. */
export function CityPicker({ country, value, onChange }: { country: string; value: string; onChange: (v: string) => void }) {
  const list = useCities(country)
  return (
    <SearchablePicker
      list={list}
      value={value}
      onChange={onChange}
      labels={{ choose: "Choose a city", search: "Search cities", loading: "Loading cities…", none: "No city found.", write: "Write your city" }}
    />
  )
}

/** Universities of a country (one small file, loaded when first needed). */
let universitiesPromise: Promise<Record<string, string[]>> | null = null
function useUniversities(country: string): ListState {
  const [all, setAll] = useState<Record<string, string[]> | null>(null)
  useEffect(() => {
    let cancelled = false
    universitiesPromise ??= import("@/data/universities.json").then((m) => m.default as Record<string, string[]>)
    universitiesPromise.then((data) => !cancelled && setAll(data)).catch(() => !cancelled && setAll({}))
    return () => {
      cancelled = true
    }
  }, [])
  return all ? { items: all[country] ?? [], loading: false } : { items: [], loading: true }
}

/** The country's universities and colleges, or "Other" to write your own. */
export function InstitutionPicker({ country, value, onChange }: { country: string; value: string; onChange: (v: string) => void }) {
  const list = useUniversities(country)
  return (
    <SearchablePicker
      list={list}
      value={value}
      onChange={onChange}
      labels={{
        choose: "Choose a university or college",
        search: "Search institutions",
        loading: "Loading institutions…",
        none: "No institution found.",
        write: "Write your institution",
      }}
    />
  )
}

/** Country dropdown with flags; Iraq unless changed. */
export function CountrySelect({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  return (
    <Select
      items={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
      value={value || "IQ"}
      onValueChange={(v) => v && v !== value && onChange(v as string)}
    >
      <SelectTrigger className="h-9 w-full">
        <SelectValue>
          {(code: string) => (
            <span className="flex items-center gap-2">
              <Flag code={code} className="h-3" /> {COUNTRIES.find((c) => c.code === code)?.name}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {COUNTRIES.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            <Flag code={c.code} className="h-3" /> {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
