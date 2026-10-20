"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { LightbulbIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { JOB_CITIES, WORKPLACES, workplaceOf, type WorkplaceKind } from "@/lib/jobs"
import { CONTRACT_TYPES, JOB_CATEGORIES } from "@/lib/options"
import { jobInputProblem, useStore } from "@/lib/store"
import type { Job, JobInput } from "@/lib/types"
import { cn } from "@/lib/utils"

const EMPTY: JobInput = {
  title: "",
  category: "",
  skills: [],
  contractType: "",
  location: { remote: false, international: false, iraqCity: "" },
  description: "",
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function Choice({ label, value, options, onChange, placeholder = "Choose" }: { label: string; value: string; options: string[]; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <Select value={value || null} onValueChange={(v) => onChange((v as string) ?? "")}>
      <SelectTrigger className="h-9 w-full" aria-label={label}>
        <SelectValue placeholder={placeholder} />
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
function SkillsInput({ value, onChange, suggestions }: { value: string[]; onChange: (v: string[]) => void; suggestions: string[] }) {
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
          <span key={s} className="flex items-center gap-1 rounded-full bg-muted py-0.5 pr-1 pl-2 text-xs">
            {s}
            <button type="button" aria-label={`Remove ${s}`} onClick={() => onChange(value.filter((x) => x !== s))} className="rounded-full p-0.5 hover:bg-background">
              <XIcon className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          list="job-skill-suggestions"
          onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value.slice(0, -1)) : setDraft(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              add(draft)
            } else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1))
          }}
          onBlur={() => draft && add(draft)}
          placeholder={value.length ? "Add another…" : "e.g. Sales, Microsoft Excel, Negotiation"}
          className="h-7 min-w-40 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          aria-label="Add a skill"
        />
        <datalist id="job-skill-suggestions">
          {left.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>
      <p className="text-xs text-muted-foreground">Press Enter after each skill. Job seekers with these skills are notified about the job.</p>
    </div>
  )
}

/** Post a new job, or edit one (`job`). */
export function JobForm({ job }: { job?: Job }) {
  const router = useRouter()
  const postJob = useStore((s) => s.postJob)
  const updateJob = useStore((s) => s.updateJob)
  const jobs = useStore((s) => s.jobs)
  const [value, setValue] = useState<JobInput>(() =>
    job
      ? { title: job.title, category: job.category, skills: job.skills, contractType: job.contractType, location: job.location, description: job.description }
      : EMPTY
  )
  const [workplace, setWorkplace] = useState<WorkplaceKind | "">(job ? workplaceOf(job.location) : "")
  const suggestions = useMemo(() => [...new Set(jobs.flatMap((j) => j.skills))].sort(), [jobs])
  const set = <K extends keyof JobInput>(key: K, v: JobInput[K]) => setValue((p) => ({ ...p, [key]: v }))

  const pickWorkplace = (w: WorkplaceKind) => {
    setWorkplace(w)
    set("location", { remote: w === "remote", international: w === "international", iraqCity: w === "city" ? value.location.iraqCity : "" })
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!workplace) return toast.error("Please choose where the job is.")
    const problem = jobInputProblem(value)
    if (problem) return toast.error(problem)
    if (job) {
      const r = updateJob(job.id, value)
      if (!r.ok) return toast.error(r.error)
      toast.success("Job updated")
      router.push(`/jobs/${job.id}`)
    } else {
      const r = postJob(value)
      if (!r.ok) return toast.error(r.error)
      toast.success(
        r.notified ? `Job posted. ${r.notified} matching job seeker${r.notified === 1 ? " was" : "s were"} notified.` : "Job posted."
      )
      router.push(`/jobs/${r.jobId}`)
    }
  }

  return (
    <form onSubmit={submit} className="divide-y rounded-xl border bg-card">
      <section className="space-y-4 p-6">
        <h2 className="font-medium">The job</h2>
        <Field label="Job title">
          <Input className="h-9" value={value.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Sales Representative" autoFocus={!job} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <Choice label="Category" value={value.category} options={JOB_CATEGORIES.includes(value.category) || !value.category ? JOB_CATEGORIES : [value.category, ...JOB_CATEGORIES]} onChange={(v) => set("category", v)} />
          </Field>
          <Field label="Contract type">
            <Choice label="Contract type" value={value.contractType} options={CONTRACT_TYPES} onChange={(v) => set("contractType", v)} />
          </Field>
        </div>
      </section>

      <section className="space-y-4 p-6">
        <h2 className="font-medium">Where</h2>
        <div className="flex gap-1.5" role="radiogroup" aria-label="Where the job is">
          {WORKPLACES.map((w) => (
            <button
              key={w.value}
              type="button"
              role="radio"
              aria-checked={workplace === w.value}
              onClick={() => pickWorkplace(w.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                workplace === w.value ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              {w.label}
            </button>
          ))}
        </div>
        {workplace === "city" && (
          <Field label="City" className="w-1/2">
            <Choice label="City" value={value.location.iraqCity} options={JOB_CITIES} onChange={(iraqCity) => set("location", { ...value.location, iraqCity })} placeholder="Choose a city" />
          </Field>
        )}
      </section>

      <section className="space-y-4 p-6">
        <h2 className="font-medium">Skills</h2>
        <SkillsInput value={value.skills} onChange={(v) => set("skills", v)} suggestions={suggestions} />
      </section>

      <section className="space-y-3 p-6">
        <h2 className="font-medium">Description</h2>
        <p className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          <LightbulbIcon className="mt-px size-3.5 shrink-0" />
          Start lines with “-” to show them as bullet points, e.g. the main tasks and what you&apos;re looking for.
        </p>
        <Textarea
          value={value.description}
          onChange={(e) => set("description", e.target.value)}
          className="min-h-48"
          placeholder={"What the job is about.\n- Main task\n- Another task\n- Experience or languages needed"}
        />
      </section>

      <div className="sticky bottom-0 flex justify-end gap-2 rounded-b-xl bg-card/95 p-4 backdrop-blur">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit">{job ? "Save changes" : "Post job"}</Button>
      </div>
    </form>
  )
}
