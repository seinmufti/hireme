"use client"

import { useState } from "react"
import { ListIcon, PlusIcon, Trash2Icon, UserRoundCheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useT } from "@/i18n/provider"
import { degreeDuration, formatDuration, jobMonths } from "@/lib/format"
import { EMPTY_WORK_PREFERENCE } from "@/lib/normalize"
import { CONTRACT_TYPES, DEGREE_STATUSES, EDUCATION, GENDERS, JOB_CATEGORIES, LANGUAGE_LEVELS, LANGUAGES } from "@/lib/options"
import { certificationComplete, degreeComplete, filled, jobComplete } from "@/lib/store"
import type { Certification, Degree, Experience, LanguageSkill, Talent, TalentInput } from "@/lib/types"
import { cn } from "@/lib/utils"
import { AttachmentField } from "./cv-fields"
import { DateOfBirthPicker } from "./date-of-birth-picker"
import { CountrySelect, InstitutionPicker } from "./pickers"
import { LanguagePicker } from "./language-picker"
import { FieldOfStudyPicker } from "./field-of-study-picker"
import { MonthPicker, PeriodPicker } from "./month-picker"

// A job seeker's portfolio: their listing in the Pool, edited from the profile page.

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

const degreeEndsTooEarly = (d: Degree) => !!d.startYear && !!d.endYear && Number(d.endYear) < Number(d.startYear)

/** "YYYY-MM" for the current month (an issue date can't be in the future). */
const thisMonth = () => new Date().toISOString().slice(0, 7)

const EMPTY_REFERENCE = { name: "", position: "", phone: "", email: "" }
const MONTH = /^\d{4}-\d{2}$/

/** Yellow: a required detail that's still missing (a field), or a job, degree or license that isn't complete (a row). */
export const MISSING_FIELD = "rounded-md bg-amber-100/70 p-1.5 -m-1.5 ring-1 ring-amber-300"
export const MISSING_ROW = "border-amber-300 bg-amber-50"

export function Field({ label, children, className, missing }: { label: string; children: React.ReactNode; className?: string; missing?: boolean }) {
  return (
    <div className={cn("space-y-1.5", missing && MISSING_FIELD, className)}>
      <Label className={cn(missing && "text-amber-900")}>{label}</Label>
      {children}
    </div>
  )
}

function Choice({
  value,
  options,
  onChange,
  invalid,
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
  invalid?: boolean
}) {
  const t = useT()
  return (
    <Select value={value || null} onValueChange={(v) => onChange((v as string) ?? "")}>
      <SelectTrigger className="h-9 w-full" aria-invalid={invalid || undefined}>
        <SelectValue placeholder={t("form.choose")} />
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
  const t = useT()
  const set = <K extends keyof TalentInput>(key: K, v: TalentInput[K]) => onChange((p) => ({ ...p, [key]: v }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label={t("form.gender")} missing={!value.gender}>
          <Choice value={value.gender} options={GENDERS} onChange={(v) => set("gender", v)} />
        </Field>
        <Field label={t("form.dateOfBirth")} missing={!value.dateOfBirth}>
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
  const t = useT()
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
          aria-label={t("form.levelOf", { language: language || t("form.language"), skill: label })}
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
  const t = useT()
  const used = value.map((l) => l.language)
  // The row added by the button opens its language dropdown right away (not rows already on the page)
  const [justAdded, setJustAdded] = useState<number | null>(null)

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("form.noLanguages")}</p>
      )}
      {value.map((l, i) => (
        // Language on the left; its speaking and reading sliders stacked on the right
        <div key={i} className={cn("grid grid-cols-[11rem_1fr_2rem] items-center gap-4 rounded-lg border p-3", !l.language && MISSING_ROW)}>
          <LanguagePicker
            value={l.language}
            // A language that's already listed can't be picked twice
            taken={used}
            autoOpen={justAdded === i}
            onChange={(language) => update(i, { language })}
          />
          <div className="space-y-2">
            <LevelSlider label={t("form.speaking")} language={l.language} value={l.speaking} onChange={(speaking) => update(i, { speaking })} />
            <LevelSlider label={t("form.reading")} language={l.language} value={l.reading} onChange={(reading) => update(i, { reading })} />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("form.removeLanguage", { language: l.language || t("form.language") })}
            onClick={() => onChange((list) => list.filter((_, j) => j !== i))}
          >
            <Trash2Icon />
          </Button>
          <div className="col-span-3 border-t pt-3">
            <AttachmentField
              label={t("form.languageCertificate")}
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
          <PlusIcon /> {t("form.addLanguage")}
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
  const t = useT()
  const [writing, setWriting] = useState(() => !!value && !options.includes(value))

  if (writing) {
    return (
      <div className="flex gap-1.5">
        <Input className="h-9" value={value} onChange={(e) => onChange(e.target.value)} placeholder={writePlaceholder} autoFocus />
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          title={t("form.chooseFromList")}
          aria-label={t("form.chooseFromList")}
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
        <SelectValue placeholder={t("form.choose")} />
      </SelectTrigger>
      <SelectContent>
        {options.map((c) => (
          <SelectItem key={c} value={c}>{c}</SelectItem>
        ))}
        <SelectSeparator />
        <SelectItem value={CUSTOM_OPTION}>{t("form.otherWriteOwn")}</SelectItem>
      </SelectContent>
    </Select>
  )
}

/** Month + year selects for a "YYYY-MM" value; only complete once both are chosen. */
/** Previous jobs: category, position title, employer, contract type and start/end dates. Most recent first. */
export function ExperienceFields({
  value,
  onChange,
}: {
  value: Experience[]
  onChange: (update: (list: Experience[]) => Experience[]) => void
}) {
  const t = useT()
  const update = (id: string, patch: Partial<Experience>) => onChange((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)))

  return (
    <div className="space-y-3">
      {value.length === 0 && <p className="text-sm text-muted-foreground">{t("form.noJobs")}</p>}
      {value.map((e, i) => (
        <div key={e.id} className={cn("rounded-lg border p-4", !jobComplete(e) && MISSING_ROW)}>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{i === 0 ? t("form.mostRecentJob") : t("form.jobN", { n: i + 1 })}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("form.removeJob", { n: i + 1 })}
              onClick={() => onChange((list) => list.filter((x) => x.id !== e.id))}
            >
              <Trash2Icon />
            </Button>
          </div>
          <div className="grid grid-cols-12 gap-3">
            <Field label={t("form.category")} className="col-span-6" missing={!filled(e.category)}>
              <ChoiceWithOther
                value={e.category}
                options={JOB_CATEGORIES}
                onChange={(category) => update(e.id, { category })}
                writePlaceholder={t("form.writeCategory")}
              />
            </Field>
            <Field label={t("form.positionTitle")} className="col-span-6" missing={!filled(e.title)}>
              <Input className="h-9" value={e.title} onChange={(ev) => update(e.id, { title: ev.target.value })} placeholder={t("form.positionPlaceholder")} />
            </Field>
            <Field label={t("form.employer")} className="col-span-6" missing={!filled(e.employer)}>
              <Input className="h-9" value={e.employer} onChange={(ev) => update(e.id, { employer: ev.target.value })} placeholder={t("form.employerPlaceholder")} />
            </Field>
            <Field label={t("form.contractType")} className="col-span-6" missing={!e.contractType}>
              <Choice value={e.contractType} options={CONTRACT_TYPES} onChange={(v) => update(e.id, { contractType: v })} />
            </Field>
            <Field label={t("form.period")} className="col-span-12" missing={!MONTH.test(e.start ?? "") || (!e.current && !MONTH.test(e.end ?? ""))}>
              <PeriodPicker start={e.start} end={e.end} current={e.current} onChange={(patch) => update(e.id, patch)} what={t("form.jobEndsBefore")} />
            </Field>
            <div className="col-span-12 flex items-center justify-between gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={e.current}
                  onChange={(ev) => update(e.id, { current: ev.target.checked, end: "" })}
                />
                {t("form.currentlyWorkHere")}
              </label>
              {jobMonths(e) > 0 && (
                <span className="text-muted-foreground">
                  {t("form.duration")} <span className="font-medium text-foreground">{formatDuration(jobMonths(e))}</span>
                </span>
              )}
            </div>
            <Field label={t("form.responsibilities")} className="col-span-12">
              <Textarea
                value={e.description}
                onChange={(ev) => update(e.id, { description: ev.target.value })}
                placeholder={t("form.responsibilitiesPlaceholder")}
                className="min-h-24 text-sm"
              />
            </Field>
            <div className="col-span-12">
              {e.reference ? (
                <div className="space-y-3 rounded-md border border-dashed p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t("form.reference")}</span>
                    <Button type="button" variant="ghost" size="xs" onClick={() => update(e.id, { reference: null })}>
                      <Trash2Icon /> {t("form.removeReference")}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        ["name", t("form.refName"), t("form.refNamePlaceholder")],
                        ["position", t("form.refPosition"), t("form.refPositionPlaceholder")],
                        ["phone", t("form.refPhone"), "+964 750 000 0000"],
                        ["email", t("form.refEmail"), "name@example.com"],
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
                  <UserRoundCheckIcon /> {t("form.addReference")}
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => onChange((list) => [...list, newExperience()])}>
        <PlusIcon /> {t("form.addJob")}
      </Button>
    </div>
  )
}


/** A list of rows with "Most recent"/numbered headers, a delete button per row and an add button. */
function RowList<T extends { id: string }>({
  items,
  label,
  addLabel,
  empty,
  onChange,
  create,
  children,
  incomplete,
}: {
  items: T[]
  label: string
  addLabel: string
  empty: string
  onChange: (update: (list: T[]) => T[]) => void
  create: () => T
  children: (item: T, update: (patch: Partial<T>) => void) => React.ReactNode
  /** Rows still missing required details turn yellow */
  incomplete?: (item: T) => boolean
}) {
  const t = useT()
  return (
    <div className="space-y-3">
      {items.length === 0 && <p className="text-sm text-muted-foreground">{empty}</p>}
      {items.map((item, i) => (
        <div key={item.id} className={cn("rounded-lg border p-4", incomplete?.(item) && MISSING_ROW)}>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {label} {i + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("form.removeItem", { item: label, n: i + 1 })}
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
  const t = useT()
  return (
    <RowList
      items={value}
      label={t("form.degree")}
      addLabel={t("form.addDegree")}
      empty={t("form.noDegrees")}
      incomplete={(d) => !degreeComplete(d)}
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
        country: "IQ",
      })}
    >
      {(d, update) => {
        const studying = d.status === "Studying"
        return (
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 grid grid-cols-12 gap-3">
              <Field label={t("form.country")} className="col-span-4">
                {/* An institution of the old country does not fit the new one */}
                <CountrySelect value={d.country ?? "IQ"} onChange={(country) => update({ country, institution: "" })} />
              </Field>
              <Field label={t("form.institution")} className="col-span-8" missing={!filled(d.institution)}>
                <InstitutionPicker
                  key={d.country ?? "IQ"}
                  country={d.country ?? "IQ"}
                  value={d.institution}
                  onChange={(institution) => update({ institution })}
                />
              </Field>
            </div>
            <Field label={t("form.degreeLevel")} missing={!filled(d.level)}>
              <Choice value={d.level} options={EDUCATION} onChange={(level) => update({ level })} />
            </Field>
            <Field label={t("form.fieldOfStudy")} missing={!filled(d.field)}>
              <FieldOfStudyPicker value={d.field} onChange={(field) => update({ field })} />
            </Field>
            <Field label={t("form.degreeName")} className="col-span-2" missing={!filled(d.name)}>
              <Input className="h-9" value={d.name} onChange={(e) => update({ name: e.target.value })} placeholder={t("form.degreeNamePlaceholder")} />
            </Field>
            <Field label={t("form.status")} className="col-span-2" missing={!filled(d.status)}>
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
                <Field label={t("form.yearStarted")} missing={!filled(d.startYear)}>
                  <Choice
                    value={d.startYear}
                    options={years(thisYear, thisYear - 60).filter((y) => !d.endYear || y <= d.endYear)}
                    onChange={(startYear) => update({ startYear })}
                  />
                </Field>
                <Field label={studying ? t("form.expectedGraduation") : t("form.yearFinished")} missing={!filled(d.endYear)}>
                  <Choice
                    value={d.endYear}
                    options={(studying ? years(thisYear + 10, thisYear) : years(thisYear, thisYear - 60)).filter(
                      (y) => !d.startYear || y >= d.startYear
                    )}
                    onChange={(endYear) => update({ endYear })}
                    invalid={degreeEndsTooEarly(d)}
                  />
                  {degreeEndsTooEarly(d) && <p className="text-xs font-medium text-destructive">{t("form.degreeEndsBefore")}</p>}
                </Field>
              </>
            )}
            {degreeDuration(d) && (
              <p className="col-span-2 text-right text-sm text-muted-foreground">
                {t("form.duration")} <span className="font-medium text-foreground">{degreeDuration(d)}</span>
              </p>
            )}
            <div className="col-span-2">
              <AttachmentField label={t("form.degreeCertificate")} value={d.attachmentIds} onChange={(attachmentIds) => update({ attachmentIds })} />
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
  const t = useT()
  return (
    <RowList
      items={value}
      label={t("form.license")}
      addLabel={t("form.addLicense")}
      empty={t("form.noLicenses")}
      incomplete={(c) => !certificationComplete(c)}
      onChange={onChange}
      create={() => ({ id: `c-${crypto.randomUUID()}`, title: "", institution: "", issued: "", attachmentIds: [] })}
    >
      {(c, update) => {
        return (
          <div className="grid grid-cols-12 gap-3">
            <Field label={t("form.licenseTitle")} className="col-span-12" missing={!filled(c.title)}>
              <Input className="h-9" value={c.title} onChange={(e) => update({ title: e.target.value })} placeholder={t("form.licenseTitlePlaceholder")} />
            </Field>
            <Field label={t("form.issuingInstitution")} className="col-span-8" missing={!filled(c.institution)}>
              <Input className="h-9" value={c.institution} onChange={(e) => update({ institution: e.target.value })} placeholder={t("form.issuingPlaceholder")} />
            </Field>
            <Field label={t("form.issueDate")} className="col-span-4" missing={!MONTH.test(c.issued ?? "")}>
              <MonthPicker value={c.issued} onChange={(issued) => update({ issued })} max={thisMonth()} />
            </Field>
            <div className="col-span-12">
              <AttachmentField label={t("form.licenseScan")} value={c.attachmentIds} onChange={(attachmentIds) => update({ attachmentIds })} />
            </div>
          </div>
        )
      }}
    </RowList>
  )
}
