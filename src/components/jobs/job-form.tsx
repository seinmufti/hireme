"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDownIcon, ChevronUpIcon, GripVerticalIcon, LayoutTemplateIcon, ListOrderedIcon, LoaderCircleIcon, SparklesIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { TagPicker } from "@/components/profile/cv-fields"
import { useT } from "@/i18n/provider"
import { JOB_CITIES, today, WORKPLACES, workplaceOf, type WorkplaceKind } from "@/lib/jobs"
import { JOB_TEMPLATES } from "@/data/job-templates"
import { CONTRACT_TYPES, EDUCATION, FIELDS_OF_STUDY, GENDERS, HARD_SKILLS, JOB_CATEGORIES, LANGUAGES, MAIN_LANGUAGES, SOFT_SKILLS } from "@/lib/options"
import { CURRENCIES, parseAmount } from "@/lib/salary"
import { jobInputProblem, useStore } from "@/lib/store"
import type { Job, JobInput, JobRequirements } from "@/lib/types"
import { cn } from "@/lib/utils"

/** Licenses and certificates often asked for in Iraq, offered while typing (any other can be written) */
const COMMON_CERTIFICATES = [
  "Driving licence",
  "Heavy vehicle licence",
  "First aid",
  "IELTS",
  "TOEFL",
  "PMP",
  "CPA",
  "ACCA",
  "CMA",
  "CCNA",
  "CompTIA A+",
  "Microsoft Office Specialist",
  "NEBOSH",
  "OSHA safety",
  "Engineers Union membership",
  "Medical practice licence",
  "Pharmacy licence",
  "Nursing licence",
]

const EMPTY: JobInput = {
  title: "",
  category: "",
  skills: [],
  contractType: "",
  location: { remote: false, international: false, iraqCity: "" },
  description: "",
  deadline: "",
  salary: null,
  languages: [],
  education: { level: "", field: "" },
  certifications: [],
  requirements: { gender: "", ageMin: null, ageMax: null, experienceYears: null },
}
const NO_REQUIREMENTS: JobRequirements = { gender: "", ageMin: null, ageMax: null, experienceYears: null }

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function Choice({ label, value, options, onChange, placeholder }: { label: string; value: string; options: string[]; onChange: (v: string) => void; placeholder?: string }) {
  const t = useT()
  return (
    <Select value={value || null} onValueChange={(v) => onChange((v as string) ?? "")}>
      <SelectTrigger className="h-9 w-full" aria-label={label}>
        <SelectValue placeholder={placeholder ?? t("common.choose")} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>{o}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Skills as chips: type one and press Enter (or comma). Suggestions come from other job posts. */
function SkillsInput({
  value,
  onChange,
  suggestions,
  listId = "job-skill-suggestions",
  placeholder,
}: {
  value: string[]
  onChange: (v: string[]) => void
  suggestions: string[]
  listId?: string
  placeholder?: string
}) {
  const t = useT()
  const [draft, setDraft] = useState("")
  const add = (raw: string) => {
    const skill = raw.trim().replace(/\s+/g, " ")
    if (skill && !value.some((s) => s.toLowerCase() === skill.toLowerCase())) onChange([...value, skill])
    setDraft("")
  }
  const left = suggestions.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()))
  return (
    <div className="space-y-2">
      <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border border-input px-2 py-1 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
        {value.map((s) => (
          <span key={s} className="flex items-center gap-1 rounded-full bg-muted py-0.5 ps-2 pe-1 text-xs">
            {s}
            <button type="button" aria-label={t("jobs.form.removeSkill", { skill: s })} onClick={() => onChange(value.filter((x) => x !== s))} className="rounded-full p-0.5 hover:bg-background">
              <XIcon className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          list={listId}
          onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value.slice(0, -1)) : setDraft(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              add(draft)
            } else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1))
          }}
          onBlur={() => draft && add(draft)}
          placeholder={value.length ? t("jobs.form.addAnother") : (placeholder ?? t("jobs.form.skillsPlaceholder"))}
          className="h-7 min-w-40 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          aria-label={t("jobs.form.addSkill")}
        />
        <datalist id={listId}>
          {left.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>
    </div>
  )
}

/** Optional salary a month: from, to (either may be empty) and the currency. */
function SalaryFields({ value, onChange }: { value: JobInput["salary"]; onChange: (v: JobInput["salary"]) => void }) {
  const t = useT()
  const s = value ?? { min: null, max: null, currency: "IQD" as const }
  const box = (key: "min" | "max", label: string) => (
    <Field label={label} className="min-w-0 flex-1">
      <Input
        className="h-9"
        inputMode="numeric"
        value={s[key] ? s[key]!.toLocaleString("en") : ""}
        onChange={(e) => onChange({ ...s, [key]: parseAmount(e.target.value) })}
        placeholder={s.currency === "USD" ? (key === "min" ? "800" : "1,200") : key === "min" ? "750,000" : "1,200,000"}
      />
    </Field>
  )
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex gap-1.5" role="radiogroup" aria-label={t("jobs.form.currency")}>
        {CURRENCIES.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={s.currency === c}
            onClick={() => onChange({ ...s, currency: c })}
            className={cn("h-9 rounded-full border px-3 text-sm", s.currency === c ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 basis-64 gap-3">
        {box("min", t("jobs.form.salaryFrom"))}
        {box("max", t("jobs.form.salaryTo"))}
      </div>
    </div>
  )
}

/**
 * Post a new job, or edit one (`job`). A new one can start from a copy of another post (`from`, "Duplicate").
 */
export function JobForm({ job, from }: { job?: Job; from?: Job }) {
  const t = useT()
  const router = useRouter()
  const postJob = useStore((s) => s.postJob)
  const updateJob = useStore((s) => s.updateJob)
  const jobs = useStore((s) => s.jobs)
  const source = job ?? from
  const [value, setValue] = useState<JobInput>(() =>
    source
      ? {
          title: source.title,
          category: source.category,
          skills: source.skills,
          contractType: source.contractType,
          location: source.location,
          description: source.description,
          // A copy gets a fresh deadline
          deadline: job ? job.deadline : "",
          salary: source.salary,
          languages: source.languages ?? [],
          education: source.education ?? { level: "", field: "" },
          certifications: source.certifications ?? [],
          requirements: source.requirements ?? NO_REQUIREMENTS,
        }
      : EMPTY
  )
  const [workplace, setWorkplace] = useState<WorkplaceKind | "">(source ? workplaceOf(source.location) : "")
  const [refining, setRefining] = useState(false)

  // "Improve wording": AI rewrites the description; the old text can be brought back from the toast
  const refine = async () => {
    const before = value.description
    if (!before.trim()) return toast.error(t("jobs.form.writeFirst"))
    setRefining(true)
    try {
      const base = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
      const res = await fetch(`${base}/api/refine-job`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: value.title, description: before }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || typeof data.description !== "string") return toast.error(data.error ?? t("jobs.form.refineFailed"))
      set("description", data.description)
      toast.success(t("jobs.form.refined"), { action: { label: t("jobs.form.undo"), onClick: () => set("description", before) } })
    } catch {
      toast.error(t("jobs.form.refineFailed"))
    } finally {
      setRefining(false)
    }
  }
  const suggestions = useMemo(() => [...new Set(jobs.flatMap((j) => j.skills))].sort(), [jobs])
  // Core competencies: the same list job seekers pick from, and what other jobs ask for
  const competencies = useMemo(() => [...new Set([...HARD_SKILLS, ...SOFT_SKILLS, ...suggestions])], [suggestions])
  // Licenses and certificates: common ones, and what other jobs ask for
  const certificates = useMemo(
    () => [...new Set([...COMMON_CERTIFICATES, ...jobs.flatMap((j) => j.certifications ?? [])])],
    [jobs]
  )
  const education = value.education ?? { level: "", field: "" }
  const [order, saveOrder] = useSectionOrder()
  const set = <K extends keyof JobInput>(key: K, v: JobInput[K]) => setValue((p) => ({ ...p, [key]: v }))

  const pickWorkplace = (w: WorkplaceKind) => {
    setWorkplace(w)
    set("location", { remote: w === "remote", international: w === "international", iraqCity: w === "city" ? value.location.iraqCity : "" })
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!workplace) return toast.error(t("jobs.form.chooseWhere"))
    const problem = jobInputProblem(value)
    if (problem) return toast.error(problem)
    if (job) {
      const r = updateJob(job.id, value)
      if (!r.ok) return toast.error(r.error)
      toast.success(t("jobs.form.updated"))
      router.push(`/jobs/${job.id}`)
    } else {
      const r = postJob(value)
      if (!r.ok) return toast.error(r.error)
      toast.success(r.notified ? t("jobs.form.postedNotified", { count: r.notified }) : t("jobs.form.posted"))
      router.push(`/jobs/${r.jobId}`)
    }
  }

  const requirements = value.requirements ?? NO_REQUIREMENTS
  const setRequirement = <K extends keyof JobRequirements>(key: K, v: JobRequirements[K]) => set("requirements", { ...requirements, [key]: v })
  const number = (text: string) => {
    const n = parseInt(text.replace(/\D/g, ""), 10)
    return Number.isFinite(n) ? n : null
  }

  // Each part of the form, by its key; shown in the employer's order (see SectionsCard)
  const parts: Record<SectionKey, { title: string; action?: React.ReactNode; body: React.ReactNode }> = {
    field: {
      title: t("jobs.form.category"),
      body: (
        <Choice label={t("jobs.form.category")} value={value.category} options={JOB_CATEGORIES.includes(value.category) || !value.category ? JOB_CATEGORIES : [value.category, ...JOB_CATEGORIES]} onChange={(v) => set("category", v)} />
      ),
    },
    job: {
      title: t("jobs.form.theJob"),
      body: (
        <>
          <Field label={t("jobs.form.jobTitle")}>
            <Input className="h-9" value={value.title} onChange={(e) => set("title", e.target.value)} placeholder={t("jobs.form.jobTitlePlaceholder")} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t("jobs.form.contractType")}>
              <Choice label={t("jobs.form.contractType")} value={value.contractType} options={CONTRACT_TYPES} onChange={(v) => set("contractType", v)} />
            </Field>
          </div>
        </>
      ),
    },
    where: {
      title: t("jobs.form.where"),
      body: (
        <>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t("jobs.form.whereLabel")}>
            {WORKPLACES.map((w) => (
              <button
                key={w.value}
                type="button"
                role="radio"
                aria-checked={workplace === w.value}
                onClick={() => pickWorkplace(w.value)}
                className={cn("rounded-full border px-3 py-1 text-sm", workplace === w.value ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}
              >
                {w.value === "city" ? t("jobs.form.onSite") : w.value === "remote" ? t("jobs.remote") : t("jobs.international")}
              </button>
            ))}
          </div>
          {workplace === "city" && (
            <Field label={t("jobs.form.city")} className="sm:w-1/2">
              <Choice label={t("jobs.form.city")} value={value.location.iraqCity} options={JOB_CITIES} onChange={(iraqCity) => set("location", { ...value.location, iraqCity })} placeholder={t("jobs.form.chooseCity")} />
            </Field>
          )}
        </>
      ),
    },
    skills: {
      title: t("jobs.form.skills"),
      // Picked like a job seeker's core competencies, so the two match up
      body: <TagPicker value={value.skills} onChange={(v) => set("skills", v)} suggestions={competencies} placeholder={t("seeker.hardSkillsPlaceholder")} />,
    },
    languages: {
      title: t("jobs.form.languages"),
      body: (
        <SkillsInput
          value={value.languages ?? []}
          onChange={(v) => set("languages", v)}
          suggestions={[...MAIN_LANGUAGES, ...LANGUAGES.filter((l) => !MAIN_LANGUAGES.includes(l))]}
          listId="job-language-suggestions"
          placeholder={t("jobs.form.languagesPlaceholder")}
        />
      ),
    },
    // The education needed: the lowest level, and the field of study if it matters
    education: {
      title: t("jobs.form.education"),
      body: (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("jobs.form.educationLevel")}>
            <Choice label={t("jobs.form.educationLevel")} value={education.level} options={EDUCATION} onChange={(level) => set("education", { ...education, level })} />
          </Field>
          <Field label={t("jobs.form.educationField")}>
            <Input
              className="h-9"
              list="job-study-fields"
              value={education.field}
              onChange={(e) => set("education", { ...education, field: e.target.value })}
              placeholder={t("jobs.form.educationFieldPlaceholder")}
            />
            <datalist id="job-study-fields">
              {FIELDS_OF_STUDY.map((f) => (
                <option key={f} value={f} />
              ))}
            </datalist>
          </Field>
        </div>
      ),
    },
    // Licenses and certificates the job asks for (optional); any can be added
    certifications: {
      title: t("jobs.form.certifications"),
      body: <TagPicker value={value.certifications ?? []} onChange={(v) => set("certifications", v)} suggestions={certificates} placeholder={t("jobs.form.certificationsPlaceholder")} />,
    },
    // Who the job is for, like a job seeker's details: gender, age and years of experience (all optional)
    requirements: {
      title: t("jobs.form.requirements"),
      body: (
        <>
          <Field label={t("jobs.form.reqGender")}>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t("jobs.form.reqGender")}>
              {["", ...GENDERS].map((g) => (
                <button
                  key={g || "any"}
                  type="button"
                  role="radio"
                  aria-checked={requirements.gender === g}
                  onClick={() => setRequirement("gender", g)}
                  className={cn("rounded-full border px-3 py-1 text-sm", requirements.gender === g ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}
                >
                  {g || t("jobs.form.anyGender")}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label={t("jobs.form.ageFrom")}>
              <Input className="h-9" inputMode="numeric" value={requirements.ageMin ?? ""} onChange={(e) => setRequirement("ageMin", number(e.target.value))} placeholder="18" />
            </Field>
            <Field label={t("jobs.form.ageTo")}>
              <Input className="h-9" inputMode="numeric" value={requirements.ageMax ?? ""} onChange={(e) => setRequirement("ageMax", number(e.target.value))} placeholder="45" />
            </Field>
            <Field label={t("jobs.form.reqExperience")} className="col-span-2 sm:col-span-1">
              <Input className="h-9" inputMode="numeric" value={requirements.experienceYears ?? ""} onChange={(e) => setRequirement("experienceYears", number(e.target.value))} placeholder="2" />
            </Field>
          </div>
        </>
      ),
    },
    salary: {
      title: t("jobs.form.salary"),
      body: <SalaryFields value={value.salary} onChange={(salary) => set("salary", salary)} />,
    },
    deadline: {
      title: t("jobs.form.deadline"),
      body: (
        <Input type="date" className="h-9 w-56" value={value.deadline} min={today()} onChange={(e) => set("deadline", e.target.value)} aria-label={t("jobs.form.deadline")} />
      ),
    },
    description: {
      title: t("jobs.form.description"),
      action: (
        <Button type="button" variant="outline" size="sm" onClick={refine} disabled={refining}>
          {refining ? <LoaderCircleIcon className="animate-spin" /> : <SparklesIcon />} {t("jobs.form.improveWording")}
        </Button>
      ),
      body: (
        <Textarea disabled={refining} value={value.description} onChange={(e) => set("description", e.target.value)} className="min-h-48" placeholder={t("jobs.form.descriptionPlaceholder")} />
      ),
    },
  }
  // New posts: a template fills the title, field, contract, competencies and description
  const applyTemplate = (tpl: (typeof JOB_TEMPLATES)[number]) => setValue((v) => ({ ...v, ...tpl }))

  return (
    // Wide screens: templates on the left (new posts), the form, and its sections on the right to jump to and reorder
    <div className={cn("grid grid-cols-1 items-start gap-6", source ? "lg:grid-cols-[minmax(0,1fr)_15rem]" : "lg:grid-cols-[15rem_minmax(0,1fr)_15rem]")}>
      {!source && (
        <aside className="no-scrollbar hidden rounded-xl border bg-card lg:sticky lg:top-[calc(3.5rem+1.5rem)] lg:block lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto">
          <h3 className="flex items-center gap-2 border-b px-4 py-3 text-sm font-semibold">
            <LayoutTemplateIcon className="size-4 text-muted-foreground" /> {t("jobs.form.template")}
          </h3>
          <ul className="p-1.5">
            {JOB_TEMPLATES.map((tpl) => (
              <li key={tpl.title}>
                <button
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className={cn("w-full rounded-lg px-2.5 py-2 text-start hover:bg-muted", value.title === tpl.title && "bg-brand-soft text-primary")}
                >
                  <span className="block text-sm font-medium">{tpl.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {tpl.category} · {tpl.contractType}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      )}

      <form onSubmit={submit} className="min-w-0 divide-y rounded-xl border bg-card">
        {/* Phones and tablets: the templates as a row above the form */}
        {!source && (
          <section className="space-y-2 p-6 lg:hidden">
            <h2 className="font-medium">{t("jobs.form.template")}</h2>
            <div className="no-scrollbar -mx-6 flex gap-1.5 overflow-x-auto px-6 [&>*]:shrink-0">
              {JOB_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.title}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className={cn("rounded-full border px-3 py-1 text-sm hover:bg-muted", value.title === tpl.title && "border-primary bg-brand-soft")}
                >
                  {tpl.title}
                </button>
              ))}
            </div>
          </section>
        )}

        {order.map((key) => (
          <section key={key} id={`job-part-${key}`} className="scroll-mt-24 space-y-4 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-medium">{parts[key].title}</h2>
              {parts[key].action}
            </div>
            {parts[key].body}
          </section>
        ))}

        <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] flex justify-end gap-2 rounded-b-xl bg-card/95 p-4 backdrop-blur lg:bottom-0">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            {t("common.cancel")}
          </Button>
          <Button type="submit">{job ? t("jobs.form.saveChanges") : t("jobs.form.post")}</Button>
        </div>
      </form>

      <SectionsCard order={order} titles={Object.fromEntries(order.map((k) => [k, parts[k].title])) as Record<SectionKey, string>} onReorder={saveOrder} />
    </div>
  )
}

/** The form's parts, in their default order */
const SECTION_KEYS = ["field", "job", "where", "skills", "languages", "education", "certifications", "requirements", "salary", "deadline", "description"] as const
type SectionKey = (typeof SECTION_KEYS)[number]
// The employer's order, kept in this browser
const ORDER_KEY = "hireme-job-form-order"

/** The employer's order for the form's parts (saved in this browser); new parts go at the end */
function useSectionOrder() {
  const [order, setOrder] = useState<SectionKey[]>([...SECTION_KEYS])
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(ORDER_KEY) ?? "[]") as string[]
      const known = saved.filter((k): k is SectionKey => (SECTION_KEYS as readonly string[]).includes(k))
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read once after the page loads (the server has no saved order)
      if (known.length) setOrder([...known, ...SECTION_KEYS.filter((k) => !known.includes(k))])
    } catch {
      // No saved order (or storage blocked): the default
    }
  }, [])
  const save = (next: SectionKey[]) => {
    setOrder(next)
    try {
      localStorage.setItem(ORDER_KEY, JSON.stringify(next))
    } catch {
      // Storage blocked: the order holds until the page is left
    }
  }
  return [order, save] as const
}

/**
 * Wide screens, beside the form (like the CV's sections card): its parts in order. A click jumps to that part;
 * dragging a row (or its arrows) moves the part up or down in the form.
 */
function SectionsCard({ order, titles, onReorder }: { order: SectionKey[]; titles: Record<SectionKey, string>; onReorder: (next: SectionKey[]) => void }) {
  const t = useT()
  const [dragging, setDragging] = useState<SectionKey | null>(null)
  const move = (key: SectionKey, to: number) => {
    const rest = order.filter((k) => k !== key)
    rest.splice(Math.max(0, Math.min(rest.length, to)), 0, key)
    onReorder(rest)
  }
  return (
    <aside className="no-scrollbar hidden rounded-xl border bg-card lg:sticky lg:top-[calc(3.5rem+1.5rem)] lg:block lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto">
      <div className="border-b px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <ListOrderedIcon className="size-4 text-muted-foreground" /> {t("jobs.form.sectionsTitle")}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{t("jobs.form.sectionsHint")}</p>
      </div>
      <ol className="p-1.5">
        {order.map((key, i) => (
          <li
            key={key}
            draggable
            onDragStart={(e) => {
              setDragging(key)
              e.dataTransfer.effectAllowed = "move"
            }}
            onDragOver={(e) => {
              e.preventDefault()
              if (dragging && dragging !== key) move(dragging, i)
            }}
            onDragEnd={() => setDragging(null)}
            className={cn("group flex items-center gap-1 rounded-lg hover:bg-muted", dragging === key && "bg-brand-soft opacity-70")}
          >
            <GripVerticalIcon className="ms-1 size-4 shrink-0 cursor-grab text-muted-foreground" aria-hidden />
            <button
              type="button"
              onClick={() => document.getElementById(`job-part-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="min-w-0 flex-1 truncate py-2 text-start text-sm"
            >
              {titles[key]}
            </button>
            {/* Without dragging: one step up or down */}
            <span className="flex shrink-0 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
              <button type="button" disabled={i === 0} onClick={() => move(key, i - 1)} aria-label={t("jobs.form.moveUp", { section: titles[key] })} className="rounded p-1 hover:bg-background disabled:opacity-30">
                <ChevronUpIcon className="size-3.5" />
              </button>
              <button type="button" disabled={i === order.length - 1} onClick={() => move(key, i + 1)} aria-label={t("jobs.form.moveDown", { section: titles[key] })} className="rounded p-1 hover:bg-background disabled:opacity-30">
                <ChevronDownIcon className="size-3.5" />
              </button>
            </span>
          </li>
        ))}
      </ol>
    </aside>
  )
}
