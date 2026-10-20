"use client"

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react"
import {
  CameraIcon,
  CheckIcon,
  ChevronDownIcon,
  FileTextIcon,
  LoaderCircleIcon,
  PaperclipIcon,
  PencilLineIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Flag, ProfilePhoto } from "@/components/cv/photo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { saveUpload, UPLOAD_ACCEPT, useStoredFile } from "@/lib/files"
import { COUNTRIES, IRAQ_CITIES } from "@/lib/options"
import type { Project, WorkPreference } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Field, MonthYearPicker } from "./portfolio-fields"

// Fields added for the CV builder: photo, location, skills, projects, work preference and uploads.

/** Uploads for one entry (degree, license, language): images (shrunk) or PDFs, up to 10 MB each. */
export function AttachmentField({ label, value, onChange }: { label: string; value: string[]; onChange: (ids: string[]) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    const added: string[] = []
    for (const file of files) {
      const res = await saveUpload(file)
      if (res.ok) added.push(res.id)
      else toast.error(res.error)
    }
    setBusy(false)
    if (added.length) onChange([...value, ...added])
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">{label}</span>
        <input
          ref={input}
          type="file"
          accept={UPLOAD_ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            upload(e.target.files)
            e.target.value = ""
          }}
        />
        <Button type="button" variant="outline" size="xs" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? <LoaderCircleIcon className="animate-spin" /> : <PaperclipIcon />} Upload
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((id) => (
            <AttachmentThumb key={id} id={id} onRemove={() => onChange(value.filter((x) => x !== id))} />
          ))}
        </div>
      )}
    </div>
  )
}

/** A small preview of an uploaded file; click to open it. */
export function AttachmentThumb({ id, onRemove }: { id: string; onRemove?: () => void }) {
  const stored = useStoredFile(id)
  const isImage = stored?.file.type.startsWith("image/")
  return (
    <div className="group relative">
      <a
        href={stored?.url}
        target="_blank"
        rel="noreferrer"
        title={stored?.file.name}
        className="flex size-16 items-center justify-center overflow-hidden rounded-md border bg-muted/40 text-muted-foreground hover:border-primary/40"
      >
        {!stored ? (
          <FileTextIcon className="size-5 opacity-40" />
        ) : isImage ? (
          <img src={stored.url} alt={stored.file.name} className="size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-0.5 px-1 text-center text-[10px] leading-tight">
            <FileTextIcon className="size-5" />
            <span className="line-clamp-2 break-all">{stored.file.name}</span>
          </span>
        )}
      </a>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${stored?.file.name ?? "file"}`}
          className="absolute -top-1.5 -right-1.5 hidden size-5 items-center justify-center rounded-full border bg-background shadow-sm group-hover:flex hover:text-destructive"
        >
          <XIcon className="size-3" />
        </button>
      )}
    </div>
  )
}

/** Profile photo: upload (shrunk to a small square-ish image), change or remove. */
export function PhotoField({
  photoId,
  name,
  color,
  onChange,
}: {
  photoId: string
  name: string
  color: string
  onChange: (id: string) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  return (
    <div className="flex items-center gap-4">
      <ProfilePhoto photoId={photoId} name={name || "?"} color={color} size={72} />
      <div className="space-y-1.5">
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            e.target.value = ""
            if (!file) return
            setBusy(true)
            const res = await saveUpload(file, { imagesOnly: true, maxSide: 600 })
            setBusy(false)
            if (res.ok) onChange(res.id)
            else toast.error(res.error)
          }}
        />
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()}>
            {busy ? <LoaderCircleIcon className="animate-spin" /> : <CameraIcon />} {photoId ? "Change photo" : "Add a photo"}
          </Button>
          {photoId && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
              <Trash2Icon /> Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Optional. A clear, professional photo of your face. Up to 10 MB.</p>
      </div>
    </div>
  )
}

/** Searchable list of Iraqi cities; any other city can be written in. */
function CityPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const q = query.trim().toLowerCase()
  const matches = IRAQ_CITIES.filter((c) => !q || c.toLowerCase().includes(q))
  const pick = (city: string) => {
    onChange(city)
    setOpen(false)
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
        <span className={cn("truncate", !value && "text-muted-foreground")}>{value || "Choose a city"}</span>
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" collisionAvoidance={{ fallbackAxisSide: "none" }} className="w-72 gap-0 p-0">
        <div className="flex items-center gap-2 border-b px-3">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                if (matches[0]) pick(matches[0])
                else if (query.trim()) pick(query.trim())
              }
            }}
            placeholder="Search cities, e.g. Erbil"
            className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoFocus
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {matches.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => pick(city)}
              className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
            >
              {city}
              {city === value && <CheckIcon className="size-4 text-primary" />}
            </button>
          ))}
          {q && !IRAQ_CITIES.some((c) => c.toLowerCase() === q) && (
            <button
              type="button"
              onClick={() => pick(query.trim())}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
            >
              <PencilLineIcon className="size-4 text-muted-foreground" />
              Use &ldquo;{query.trim()}&rdquo;
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/** Country (with flag), city and street address. */
export function LocationFields({
  value,
  onChange,
}: {
  value: { country: string; city: string; address: string }
  onChange: (patch: Partial<{ country: string; city: string; address: string }>) => void
}) {
  const inIraq = value.country === "IQ"
  return (
    <div className="grid grid-cols-12 gap-4">
      <Field label="Country" className="col-span-4">
        <Select
          items={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
          value={value.country || "IQ"}
          // A city in the old country doesn't fit the new one
          onValueChange={(v) => v && v !== value.country && onChange({ country: v as string, city: "" })}
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
      </Field>
      <Field label="City" className="col-span-4">
        {inIraq ? (
          <CityPicker value={value.city} onChange={(city) => onChange({ city })} />
        ) : (
          <Input className="h-9" value={value.city} onChange={(e) => onChange({ city: e.target.value })} placeholder="City" />
        )}
      </Field>
      <Field label="Address (optional, private)" className="col-span-4">
        <Input className="h-9" value={value.address} onChange={(e) => onChange({ address: e.target.value })} placeholder="Street, area" />
      </Field>
      <p className="col-span-12 -mt-2 text-xs text-muted-foreground">Your address is only on your own CV. Employers see your city.</p>
    </div>
  )
}

/** Chips with a search box under them: pick from suggestions or (optionally) add your own. */
export function TagPicker({
  value,
  onChange,
  suggestions,
  allowCustom = true,
  placeholder,
}: {
  value: string[]
  onChange: (list: string[]) => void
  suggestions: string[]
  allowCustom?: boolean
  placeholder: string
}) {
  const [query, setQuery] = useState("")
  const q = query.trim().toLowerCase()
  const has = (s: string) => value.some((v) => v.toLowerCase() === s.toLowerCase())
  const shown = suggestions.filter((s) => !has(s) && (!q || s.toLowerCase().includes(q))).slice(0, q ? 12 : 10)
  const add = (s: string) => {
    const clean = s.trim()
    if (clean && !has(clean)) onChange([...value, clean])
    setQuery("")
  }

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((s) => (
            <span key={s} className="flex items-center gap-1 rounded-full bg-primary/10 py-0.5 pr-1 pl-2.5 text-sm text-primary">
              {s}
              <button
                type="button"
                aria-label={`Remove ${s}`}
                onClick={() => onChange(value.filter((x) => x !== s))}
                className="rounded-full p-0.5 hover:bg-primary/15"
              >
                <XIcon className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-9 pl-8"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return
            e.preventDefault()
            if (shown[0] && (!allowCustom || shown[0].toLowerCase() === q)) add(shown[0])
            else if (allowCustom && q) add(query)
            else if (shown[0]) add(shown[0])
          }}
          placeholder={placeholder}
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {shown.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => add(s)}
            className="flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
            <PlusIcon className="size-3" /> {s}
          </button>
        ))}
        {allowCustom && q && !suggestions.some((s) => s.toLowerCase() === q) && !has(query) && (
          <button
            type="button"
            onClick={() => add(query)}
            className="flex items-center gap-1 rounded-full border border-dashed border-primary/50 px-2.5 py-0.5 text-xs text-primary hover:bg-primary/5"
          >
            <PlusIcon className="size-3" /> Add &ldquo;{query.trim()}&rdquo;
          </button>
        )}
      </div>
    </div>
  )
}

/** Projects and activities: name, optional link, dates and a short description. */
export function ProjectFields({ value, onChange }: { value: Project[]; onChange: (update: (list: Project[]) => Project[]) => void }) {
  const update = (id: string, patch: Partial<Project>) => onChange((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  return (
    <div className="space-y-3">
      {value.length === 0 && <p className="text-sm text-muted-foreground">No projects or activities added. They&apos;re optional.</p>}
      {value.map((p, i) => (
        <div key={p.id} className="rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Project {i + 1}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove project ${i + 1}`}
              onClick={() => onChange((list) => list.filter((x) => x.id !== p.id))}
            >
              <Trash2Icon />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <Input className="h-9" value={p.name} onChange={(e) => update(p.id, { name: e.target.value })} placeholder="e.g. Volunteer at the Red Crescent" />
            </Field>
            <Field label="Link (optional)">
              <Input className="h-9" value={p.link} onChange={(e) => update(p.id, { link: e.target.value })} placeholder="https://…" />
            </Field>
            <Field label="Start (optional)">
              <MonthYearPicker value={p.start} onChange={(start) => update(p.id, { start })} />
            </Field>
            <Field label="End (optional, empty if ongoing)">
              <MonthYearPicker value={p.end} onChange={(end) => update(p.id, { end })} />
            </Field>
            <Field label="Description (optional)" className="col-span-2">
              <Textarea
                className="min-h-16 text-sm"
                value={p.description}
                onChange={(e) => update(p.id, { description: e.target.value })}
                placeholder="What you did and what came of it"
              />
            </Field>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          onChange((list) => [...list, { id: `p-${crypto.randomUUID()}`, name: "", link: "", description: "", start: "", end: "" }])
        }
      >
        <PlusIcon /> Add a project or activity
      </Button>
    </div>
  )
}

/** Where the job seeker wants to work. Used for job matching and employers' filters; not shown on the CV. */
export function WorkPreferenceFields({ value, onChange }: { value: WorkPreference; onChange: (v: WorkPreference) => void }) {
  const toggle = (key: "remote" | "international", label: string, hint: string) => (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-sm transition-colors",
        value[key] ? "border-primary bg-primary/5" : "hover:bg-muted/50"
      )}
    >
      <input type="checkbox" className="mt-0.5 size-4 accent-primary" checked={value[key]} onChange={(e) => onChange({ ...value, [key]: e.target.checked })} />
      <span>
        <span className="font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </label>
  )
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {toggle("remote", "Remote", "Work from home for a company anywhere")}
        {toggle("international", "International", "Jobs outside Iraq")}
      </div>
      <Field label="Cities in Iraq where you'd work">
        <TagPicker
          value={value.iraqCities}
          onChange={(iraqCities) => onChange({ ...value, iraqCities })}
          suggestions={IRAQ_CITIES}
          allowCustom={false}
          placeholder="Search cities, e.g. Sulaymaniyah"
        />
      </Field>
    </div>
  )
}
