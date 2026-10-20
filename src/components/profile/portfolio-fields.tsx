"use client"

import { useState } from "react"
import { LightbulbIcon, ListIcon, PlusIcon, Trash2Icon, UserRoundCheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { formatDuration, jobMonths } from "@/lib/format"
import { EMPTY_WORK_PREFERENCE } from "@/lib/normalize"
import { CONTRACT_TYPES, DEGREE_STATUSES, EDUCATION, GENDERS, JOB_CATEGORIES, LANGUAGE_LEVELS, LANGUAGES } from "@/lib/options"
import type { Certification, Degree, Experience, LanguageSkill, Talent, TalentInput } from "@/lib/types"
import { cn } from "@/lib/utils"
import { AttachmentField } from "./cv-fields"
import { DateOfBirthPicker } from "./date-of-birth-picker"
import { LanguagePicker } from "./language-picker"
import { FieldOfStudyPicker } from "./field-of-study-picker"

// A job seeker's portfolio: their listing in The Pool, edited from the profile page.

export const EMPTY_PORTFOLIO: TalentInput = {
  gender: "",
  dateOfBirth: "",
  summary: "",
  degrees: [],
  certifications: [],
  languages: [],
  experiences: [],
  hardSkills: [],
  softSkills: [],
  projects: [],
  workPreference: EMPTY_WORK_PREFERENCE,
  published: false,
}

export const toPortfolioInput = (t: Talent): TalentInput => ({
  gender: t.gender,
  dateOfBirth: t.dateOfBirth,
  summary: t.summary,
  degrees: t.degrees,
  certifications: t.certifications,
  languages: t.languages,
  experiences: t.experiences,
  hardSkills: t.hardSkills,
  softSkills: t.softSkills,
  projects: t.projects,
  workPreference: t.workPreference,
  published: t.published,
})

const newExperience = (): Experience => ({
  id: `x-${crypto.randomUUID()}`,
  title: "",
  employer: "",
  category: "",
  contractType: "",
  start: "",
  end: "",
  current: false,
  description: "",
  reference: null,
})

const EMPTY_REFERENCE = { name: "", position: "", phone: "", email: "" }

export function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function Choice({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <Select value={value || null} onValueChange={(v) => onChange((v as string) ?? "")}>
      <SelectTrigger className="h-9 w-full">
        <SelectValue placeholder="Choose" />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>{o}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Gender and date of birth. */
export function PersonalFields({
  value,
  onChange,
}: {
  value: TalentInput
  onChange: (update: (p: TalentInput) => TalentInput) => void
}) {
  const set = <K extends keyof TalentInput>(key: K, v: TalentInput[K]) => onChange((p) => ({ ...p, [key]: v }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Gender">
          <Choice value={value.gender} options={GENDERS} onChange={(v) => set("gender", v)} />
        </Field>
        <Field label="Date of birth">
          <DateOfBirthPicker value={value.dateOfBirth} onChange={(v) => set("dateOfBirth", v)} />
        </Field>
      </div>
    </div>
  )
}

// Weakest to strongest, left to right on the slider
const SLIDER_LEVELS = [...LANGUAGE_LEVELS].reverse()

/** A slider that snaps to the language levels A1 … C2, Native. */
// A1 to C2 run from yellow to green; Native is blue
function levelColor(index: number) {
  const last = SLIDER_LEVELS.length - 1
  if (index === last) return "hsl(217 85% 48%)"
  return `hsl(${48 + (index / (last - 1)) * 92} 80% 38%)`
}

function LevelSlider({ label, language, value, onChange }: { label: string; language: string; value: string; onChange: (v: string) => void }) {
  const index = Math.max(0, SLIDER_LEVELS.findIndex((l) => l.value === value))
  const current = SLIDER_LEVELS[index]
  const color = levelColor(index)
  return (
    <div className="grid grid-cols-[4.5rem_1fr_10.5rem] items-center gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div>
        <input
          type="range"
          min={0}
          max={SLIDER_LEVELS.length - 1}
          step={1}
          value={index}
          onChange={(e) => onChange(SLIDER_LEVELS[Number(e.target.value)].value)}
          aria-label={`${language || "Language"} ${label.toLowerCase()} level`}
          aria-valuetext={current.label}
          className="h-1.5 w-full cursor-pointer"
          style={{ accentColor: color }}
        />
        <div className="mt-0.5 flex justify-between px-0.5 text-[10px]" aria-hidden>
          {SLIDER_LEVELS.map((l, i) => (
            <span key={l.value} className={cn(l.value === current.value && "font-bold")} style={{ color: levelColor(i) }}>
              {l.value === "Native" ? "N" : l.value}
            </span>
          ))}
        </div>
      </div>
      <span className="truncate text-sm font-medium" style={{ color }}>{current.label}</span>
    </div>
  )
}

/** One row per language: the language on the left, speaking and reading levels on the right. */
export function LanguageFields({
  value,
  onChange,
}: {
  value: LanguageSkill[]
  onChange: (update: (list: LanguageSkill[]) => LanguageSkill[]) => void
}) {
  const update = (i: number, patch: Partial<LanguageSkill>) =>
    onChange((list) => list.map((l, j) => (j === i ? { ...l, ...patch } : l)))
  const used = value.map((l) => l.language)
  // The row added by the button opens its language dropdown right away (not rows already on the page)
  const [justAdded, setJustAdded] = useState<number | null>(null)

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-sm text-muted-foreground">No languages added yet. You need at least one to appear in The Pool.</p>
      )}
      {value.map((l, i) => (
        // Language on the left; its speaking and reading sliders stacked on the right
        <div key={i} className="grid grid-cols-[11rem_1fr_2rem] items-center gap-4 rounded-lg border p-3">
          <LanguagePicker
            value={l.language}
            // A language that's already listed can't be picked twice
            taken={used}
            autoOpen={justAdded === i}
            onChange={(language) => update(i, { language })}
          />
          <div className="space-y-2">
            <LevelSlider label="Speaking" language={l.language} value={l.speaking} onChange={(speaking) => update(i, { speaking })} />
            <LevelSlider label="Reading" language={l.language} value={l.reading} onChange={(reading) => update(i, { reading })} />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove ${l.language || "language"}`}
            onClick={() => onChange((list) => list.filter((_, j) => j !== i))}
          >
            <Trash2Icon />
          </Button>
          <div className="col-span-3 border-t pt-3">
            <AttachmentField
              label="Language certificate, e.g. IELTS (optional)"
              value={l.attachmentIds}
              onChange={(attachmentIds) => update(i, { attachmentIds })}
            />
          </div>
        </div>
      ))}
      {used.length < LANGUAGES.length && (
        <Button
          type="button"
          variant="outline"
          className="mt-1"
          onClick={() => {
            setJustAdded(value.length)
            onChange((list) => [...list, { language: "", speaking: "A1", reading: "A1", attachmentIds: [] }])
          }}
        >
          <PlusIcon /> Add a language
        </Button>
      )}
    </div>
  )
}

const CUSTOM_OPTION = "__custom__"

/** Pick from the list, or choose "Other" and write your own (e.g. job categories). */
function ChoiceWithOther({
  value,
  options,
  onChange,
  writePlaceholder,
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
  writePlaceholder: string
}) {
  const [writing, setWriting] = useState(() => !!value && !options.includes(value))

  if (writing) {
    return (
      <div className="flex gap-1.5">
        <Input className="h-9" value={value} onChange={(e) => onChange(e.target.value)} placeholder={writePlaceholder} autoFocus />
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          title="Choose from the list"
          aria-label="Choose from the list"
          onClick={() => {
            setWriting(false)
            onChange("")
          }}
        >
          <ListIcon />
        </Button>
      </div>
    )
  }

  return (
    <Select
      value={value || null}
      onValueChange={(v) => {
        if (v === CUSTOM_OPTION) {
          setWriting(true)
          onChange("")
        } else onChange((v as string) ?? "")
      }}
    >
      <SelectTrigger className="h-9 w-full">
        <SelectValue placeholder="Choose" />
      </SelectTrigger>
      <SelectContent>
        {options.map((c) => (
          <SelectItem key={c} value={c}>{c}</SelectItem>
        ))}
        <SelectSeparator />
        <SelectItem value={CUSTOM_OPTION}>Other (write your own)</SelectItem>
      </SelectContent>
    </Select>
  )
}

/** Month + year selects for a "YYYY-MM" value; only complete once both are chosen. */
export function MonthYearPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const thisYear = new Date().getFullYear()
  const years = Array.from({ length: 60 }, (_, i) => String(thisYear - i))
  const [year = "", month = ""] = value ? value.split("-") : []
  const set = (y: string, m: string) => onChange(y && m ? `${y}-${m}` : y ? `${y}-` : m ? `-${m}` : "")
  const months = MONTHS.map((m, i) => ({ value: String(i + 1).padStart(2, "0"), label: m }))
  return (
    <div className="grid grid-cols-2 gap-3">
      <Select items={months} value={month || null} onValueChange={(v) => set(year, (v as string) ?? "")}>
        <SelectTrigger className="h-9 w-full">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          {months.map((m) => (
            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Choice value={year} options={years} onChange={(y) => set(y, month)} />
    </div>
  )
}

/** Previous jobs: category, position title, employer, contract type and start/end dates. Most recent first. */
export function ExperienceFields({
  value,
  onChange,
}: {
  value: Experience[]
  onChange: (update: (list: Experience[]) => Experience[]) => void
}) {
  const update = (id: string, patch: Partial<Experience>) => onChange((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)))

  return (
    <div className="space-y-3">
      {value.length === 0 && <p className="text-sm text-muted-foreground">No previous jobs added yet.</p>}
      {value.map((e, i) => (
        <div key={e.id} className="rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{i === 0 ? "Most recent job" : `Job ${i + 1}`}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove job ${i + 1}`}
              onClick={() => onChange((list) => list.filter((x) => x.id !== e.id))}
            >
              <Trash2Icon />
            </Button>
          </div>
          <div className="grid grid-cols-12 gap-3">
            <Field label="Category" className="col-span-6">
              <ChoiceWithOther
                value={e.category}
                options={JOB_CATEGORIES}
                onChange={(category) => update(e.id, { category })}
                writePlaceholder="Write your category"
              />
            </Field>
            <Field label="Position title" className="col-span-6">
              <Input className="h-9" value={e.title} onChange={(ev) => update(e.id, { title: ev.target.value })} placeholder="e.g. Accountant" />
            </Field>
            <Field label="Employer" className="col-span-6">
              <Input className="h-9" value={e.employer} onChange={(ev) => update(e.id, { employer: ev.target.value })} placeholder="Company name" />
            </Field>
            <Field label="Contract type" className="col-span-6">
              <Choice value={e.contractType} options={CONTRACT_TYPES} onChange={(v) => update(e.id, { contractType: v })} />
            </Field>
            <Field label="Start date" className="col-span-6">
              <MonthYearPicker value={e.start} onChange={(start) => update(e.id, { start })} />
            </Field>
            <Field label="End date" className="col-span-6">
              {e.current ? (
                <div className="flex h-9 items-center text-sm text-muted-foreground">Present</div>
              ) : (
                <MonthYearPicker value={e.end} onChange={(end) => update(e.id, { end })} />
              )}
            </Field>
            <div className="col-span-12 flex items-center justify-between gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={e.current}
                  onChange={(ev) => update(e.id, { current: ev.target.checked, end: "" })}
                />
                I currently work here
              </label>
              {jobMonths(e) > 0 && (
                <span className="text-muted-foreground">
                  Duration: <span className="font-medium text-foreground">{formatDuration(jobMonths(e))}</span>
                </span>
              )}
            </div>
            <Field label="Responsibilities and achievements" className="col-span-12">
              <p className="flex items-start gap-1.5 rounded-md bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900">
                <LightbulbIcon className="mt-px size-3.5 shrink-0" />
                Tip: write one bullet point per line, mostly achievements. Start with a verb and add numbers where you can,
                e.g. &ldquo;Increased monthly sales by 20%&rdquo;.
              </p>
              <Textarea
                value={e.description}
                onChange={(ev) => update(e.id, { description: ev.target.value })}
                placeholder={"Increased monthly sales by 20% in one year\nTrained 5 new team members\nHandled 50+ customer requests a day"}
                className="min-h-24 text-sm"
              />
            </Field>
            <div className="col-span-12">
              {e.reference ? (
                <div className="space-y-3 rounded-md border border-dashed p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Reference</span>
                    <Button type="button" variant="ghost" size="xs" onClick={() => update(e.id, { reference: null })}>
                      <Trash2Icon /> Remove reference
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Employers and your CV only show &ldquo;Reference available on request&rdquo;.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        ["name", "Name", "Full name"],
                        ["position", "Position", "e.g. Sales Manager"],
                        ["phone", "Phone", "+964 750 000 0000"],
                        ["email", "Email", "name@example.com"],
                      ] as const
                    ).map(([key, label, placeholder]) => (
                      <Field key={key} label={label}>
                        <Input
                          className="h-9"
                          value={e.reference![key]}
                          onChange={(ev) => update(e.id, { reference: { ...e.reference!, [key]: ev.target.value } })}
                          placeholder={placeholder}
                        />
                      </Field>
                    ))}
                  </div>
                </div>
              ) : (
                <Button type="button" variant="ghost" size="sm" onClick={() => update(e.id, { reference: EMPTY_REFERENCE })}>
                  <UserRoundCheckIcon /> Add a reference (optional)
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => onChange((list) => [...list, newExperience()])}>
        <PlusIcon /> Add a job
      </Button>
    </div>
  )
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** A list of rows with "Most recent"/numbered headers, a delete button per row and an add button. */
function RowList<T extends { id: string }>({
  items,
  label,
  addLabel,
  empty,
  onChange,
  create,
  children,
}: {
  items: T[]
  label: string
  addLabel: string
  empty: string
  onChange: (update: (list: T[]) => T[]) => void
  create: () => T
  children: (item: T, update: (patch: Partial<T>) => void) => React.ReactNode
}) {
  return (
    <div className="space-y-3">
      {items.length === 0 && <p className="text-sm text-muted-foreground">{empty}</p>}
      {items.map((item, i) => (
        <div key={item.id} className="rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {label} {i + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove ${label.toLowerCase()} ${i + 1}`}
              onClick={() => onChange((list) => list.filter((x) => x.id !== item.id))}
            >
              <Trash2Icon />
            </Button>
          </div>
          {children(item, (patch) => onChange((list) => list.map((x) => (x.id === item.id ? { ...x, ...patch } : x))))}
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => onChange((list) => [...list, create()])}>
        <PlusIcon /> {addLabel}
      </Button>
    </div>
  )
}

/** Degrees: institution, level, name, field, and whether graduated or still studying (with the years). */
export function DegreeFields({
  value,
  onChange,
}: {
  value: Degree[]
  onChange: (update: (list: Degree[]) => Degree[]) => void
}) {
  const thisYear = new Date().getFullYear()
  // Start years: this year back 60 years. Graduated: finish up to this year. Studying: finish up to 10 years ahead.
  const years = (from: number, to: number) => Array.from({ length: from - to + 1 }, (_, i) => String(from - i))
  return (
    <RowList
      items={value}
      label="Degree"
      addLabel="Add a degree"
      empty="No degrees added yet. You need at least one to appear in The Pool."
      onChange={onChange}
      create={() => ({
        id: `d-${crypto.randomUUID()}`,
        level: "",
        name: "",
        field: "",
        institution: "",
        status: "",
        startYear: "",
        endYear: "",
        attachmentIds: [],
      })}
    >
      {(d, update) => {
        const studying = d.status === "Studying"
        return (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Institution" className="col-span-2">
              <Input className="h-9" value={d.institution} onChange={(e) => update({ institution: e.target.value })} placeholder="University, college or school" />
            </Field>
            <Field label="Degree level">
              <Choice value={d.level} options={EDUCATION} onChange={(level) => update({ level })} />
            </Field>
            <Field label="Field of study">
              <FieldOfStudyPicker value={d.field} onChange={(field) => update({ field })} />
            </Field>
            <Field label="Degree name" className="col-span-2">
              <Input className="h-9" value={d.name} onChange={(e) => update({ name: e.target.value })} placeholder="e.g. BSc in Computer Science" />
            </Field>
            <Field label="Status" className="col-span-2">
              <div className="flex gap-1.5">
                {DEGREE_STATUSES.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => update({ status: st, endYear: "" })}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm",
                      d.status === st ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
                    )}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </Field>
            {d.status && (
              <>
                <Field label="Year started">
                  <Choice value={d.startYear} options={years(thisYear, thisYear - 60)} onChange={(startYear) => update({ startYear })} />
                </Field>
                <Field label={studying ? "Expected year of graduation" : "Year finished"}>
                  <Choice
                    value={d.endYear}
                    options={studying ? years(thisYear + 10, thisYear) : years(thisYear, thisYear - 60)}
                    onChange={(endYear) => update({ endYear })}
                  />
                </Field>
              </>
            )}
            <div className="col-span-2">
              <AttachmentField label="Degree certificate (optional)" value={d.attachmentIds} onChange={(attachmentIds) => update({ attachmentIds })} />
            </div>
          </div>
        )
      }}
    </RowList>
  )
}

/** Licenses and certifications: title, issuing institution, issue month/year and scans. Optional. */
export function CertificationFields({
  value,
  onChange,
}: {
  value: Certification[]
  onChange: (update: (list: Certification[]) => Certification[]) => void
}) {
  const thisYear = new Date().getFullYear()
  const years = Array.from({ length: 50 }, (_, i) => String(thisYear - i))
  return (
    <RowList
      items={value}
      label="License or certification"
      addLabel="Add a license or certification"
      empty="No licenses or certifications added. They're optional."
      onChange={onChange}
      create={() => ({ id: `c-${crypto.randomUUID()}`, title: "", institution: "", issued: "", attachmentIds: [] })}
    >
      {(c, update) => {
        const [year = "", month = ""] = c.issued ? c.issued.split("-") : []
        // Stored as "YYYY-MM"; only complete once both parts are chosen
        const setIssued = (y: string, m: string) => update({ issued: y && m ? `${y}-${m}` : y ? `${y}-` : m ? `-${m}` : "" })
        return (
          <div className="grid grid-cols-12 gap-3">
            <Field label="Title" className="col-span-12">
              <Input className="h-9" value={c.title} onChange={(e) => update({ title: e.target.value })} placeholder="e.g. AWS Certified Cloud Practitioner, Driving licence" />
            </Field>
            <Field label="Issuing institution" className="col-span-6">
              <Input className="h-9" value={c.institution} onChange={(e) => update({ institution: e.target.value })} placeholder="e.g. Amazon Web Services" />
            </Field>
            <Field label="Issue month" className="col-span-3">
              <Select
                items={MONTHS.map((m, i) => ({ value: String(i + 1).padStart(2, "0"), label: m }))}
                value={month || null}
                onValueChange={(v) => setIssued(year, (v as string) ?? "")}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={m} value={String(i + 1).padStart(2, "0")}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Issue year" className="col-span-3">
              <Choice value={year} options={years} onChange={(y) => setIssued(y, month)} />
            </Field>
            <div className="col-span-12">
              <AttachmentField label="Scan of the license or certificate (optional)" value={c.attachmentIds} onChange={(attachmentIds) => update({ attachmentIds })} />
            </div>
          </div>
        )
      }}
    </RowList>
  )
}
