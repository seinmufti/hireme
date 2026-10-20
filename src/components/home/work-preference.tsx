"use client"

import { useState } from "react"
import { BriefcaseIcon, CheckIcon, ChevronDownIcon, ClockIcon, GlobeIcon, GraduationCapIcon, MapPinIcon, SearchIcon, WifiIcon } from "lucide-react"
import { toast } from "sonner"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useT } from "@/i18n/provider"
import type { MessageKey } from "@/i18n/types"
import { cn } from "@/lib/utils"
import { EMPTY_PREFERENCE, IRAQI_CITIES, saveWorkPreference, type HomeTalent, type HomeUser, type WorkPreference } from "./home-data"

/**
 * The type of work the job seeker wants: where (remote, Iraqi cities, international) and which contracts
 * (full-time, part-time, internship; none ticked means any).
 * Saved straight away; job matching and alerts use it. It isn't shown on the CV.
 */
export function WorkPreferenceCard({ user, talent }: { user: HomeUser; talent: HomeTalent | null }) {
  const t = useT()
  const pref = { ...EMPTY_PREFERENCE, ...talent?.workPreference }
  // "Local" (a city in Iraq) is on while cities are picked, or while picking the first one
  const [iraqOpen, setIraqOpen] = useState(false)
  const iraqOn = pref.iraqCities.length > 0 || iraqOpen

  const save = (next: WorkPreference) => {
    saveWorkPreference(user.id, next)
    toast.success(t("home.preferenceSaved"))
  }

  return (
    <section className="rounded-xl border bg-card p-4">
      <h3 className="text-sm font-semibold">{t("home.workType")}</h3>
      <p className="mb-3 text-xs text-muted-foreground">{t("home.workTypeHint")}</p>
      <fieldset disabled={!talent} className="space-y-2">
        <Toggle icon={WifiIcon} label={t("home.workRemote")} checked={pref.remote} onChange={(remote) => save({ ...pref, remote })} />
        <Toggle
          icon={MapPinIcon}
          label={t("home.workIraq")}
          checked={iraqOn}
          onChange={(on) => {
            if (on) setIraqOpen(true)
            else {
              setIraqOpen(false)
              if (pref.iraqCities.length) save({ ...pref, iraqCities: [] })
            }
          }}
        >
          {iraqOn && (
            <CityPicker
              value={pref.iraqCities}
              defaultOpen={iraqOpen && pref.iraqCities.length === 0}
              onChange={(iraqCities) => {
                if (!iraqCities.length) setIraqOpen(false)
                save({ ...pref, iraqCities })
              }}
            />
          )}
        </Toggle>
        <Toggle
          icon={GlobeIcon}
          label={t("home.workInternational")}
          checked={pref.international}
          onChange={(international) => save({ ...pref, international })}
        />

        <p className="pt-2 text-xs font-medium text-muted-foreground">{t("home.contractType")}</p>
        {CONTRACTS.map((c) => {
          const chosen = pref.contractTypes ?? []
          return (
            <Toggle
              key={c.value}
              icon={c.icon}
              label={t(c.label)}
              checked={chosen.includes(c.value)}
              onChange={(on) => save({ ...pref, contractTypes: on ? [...chosen, c.value] : chosen.filter((x) => x !== c.value) })}
            />
          )
        })}
      </fieldset>
    </section>
  )
}

// Stored as the CONTRACT_TYPES values (English), shown in the page's language
const CONTRACTS: { value: string; label: MessageKey; icon: typeof WifiIcon }[] = [
  { value: "Full-time", label: "home.fullTime", icon: BriefcaseIcon },
  { value: "Part-time", label: "home.partTime", icon: ClockIcon },
  { value: "Internship", label: "home.internship", icon: GraduationCapIcon },
]

function Toggle({
  icon: Icon,
  label,
  checked,
  onChange,
  children,
}: {
  icon: typeof WifiIcon
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  children?: React.ReactNode
}) {
  return (
    <div className={cn("rounded-lg border transition-colors", checked && "border-primary/50 bg-brand-soft")}>
      <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm">
        <input type="checkbox" className="size-4 accent-primary" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <Icon className="size-4 text-muted-foreground" />
        {label}
      </label>
      {children && <div className="px-3 pb-2.5">{children}</div>}
    </div>
  )
}

function CityPicker({ value, defaultOpen, onChange }: { value: string[]; defaultOpen: boolean; onChange: (cities: string[]) => void }) {
  const t = useT()
  const [open, setOpen] = useState(defaultOpen)
  const [query, setQuery] = useState("")
  const q = query.trim().toLowerCase()
  const cities = IRAQI_CITIES.filter((c) => !q || c.toLowerCase().includes(q))
  const toggle = (city: string) => onChange(value.includes(city) ? value.filter((c) => c !== city) : [...value, city])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="flex h-8 w-full items-center justify-between gap-2 rounded-md border bg-background px-2.5 text-start text-xs"
          />
        }
      >
        <span className="truncate">{value.length ? value.join(", ") : t("home.pickCities")}</span>
        <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 gap-0 p-0">
        <div className="flex items-center gap-2 border-b px-2.5">
          <SearchIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("home.searchCities")}
            className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoFocus
          />
        </div>
        <ul className="max-h-60 overflow-y-auto p-1">
          {cities.map((city) => {
            const on = value.includes(city)
            return (
              <li key={city}>
                <button
                  type="button"
                  onClick={() => toggle(city)}
                  className={cn("flex w-full items-center justify-between rounded-md px-2 py-1.5 text-start text-sm hover:bg-muted", on && "font-medium")}
                >
                  {city}
                  {on && <CheckIcon className="size-4 text-primary" />}
                </button>
              </li>
            )
          })}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
