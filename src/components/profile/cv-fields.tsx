"use client"

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react"
import {
  CameraIcon,
  FileTextIcon,
  LoaderCircleIcon,
  LockIcon,
  MapPinIcon,
  PaperclipIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"
import { ProfilePhoto } from "@/components/cv/photo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { saveUpload, UPLOAD_ACCEPT, useStoredFile } from "@/lib/files"
import { projectDuration } from "@/lib/format"
import { IRAQ_CITIES } from "@/lib/options"
import type { Project, WorkPreference } from "@/lib/types"
import { useT } from "@/i18n/provider"
import { cn } from "@/lib/utils"
import { CityPicker, CountrySelect } from "./pickers"
import { PeriodPicker } from "./month-picker"
import { Field } from "./portfolio-fields"

// Fields added for the CV builder: photo, location, skills, projects, work preference and uploads.

/** Uploads for one entry (degree, license, language): images (shrunk) or PDFs, up to 10 MB each. */
export function AttachmentField({ label, value, onChange }: { label: string; value: string[]; onChange: (ids: string[]) => void }) {
  const t = useT()
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
          {busy ? <LoaderCircleIcon className="animate-spin" /> : <PaperclipIcon />} {t("form.upload")}
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
  const t = useT()
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
          aria-label={t("form.removeFile", { file: stored?.file.name ?? "" })}
          className="absolute -top-1.5 -end-1.5 hidden size-5 items-center justify-center rounded-full border bg-background shadow-sm group-hover:flex hover:text-destructive"
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
  const t = useT()
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
            {busy ? <LoaderCircleIcon className="animate-spin" /> : <CameraIcon />} {photoId ? t("form.changePhoto") : t("form.addPhoto")}
          </Button>
          {photoId && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
              <Trash2Icon /> {t("form.remove")}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{t("form.photoHint")}</p>
      </div>
    </div>
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
  const t = useT()
  return (
    <div className="grid grid-cols-12 gap-4 rounded-xl border bg-muted/30 p-4">
      <div className="col-span-12 flex items-center gap-2">
        <MapPinIcon className="size-4 text-primary" />
        <h3 className="text-sm font-medium">{t("seeker.location")}</h3>
      </div>
      <Field label={t("form.country")} className="col-span-4">
        {/* A city in the old country does not fit the new one */}
        <CountrySelect value={value.country} onChange={(country) => onChange({ country, city: "" })} />
      </Field>
      <Field label={t("form.city")} className="col-span-4">
        {/* Keyed so each country starts with its own list */}
        <CityPicker key={value.country} country={value.country || "IQ"} value={value.city} onChange={(city) => onChange({ city })} />
      </Field>
      <Field label={t("form.addressOptional")} className="col-span-4">
        <Input className="h-9" value={value.address} onChange={(e) => onChange({ address: e.target.value })} placeholder={t("form.addressPlaceholder")} />
      </Field>
      <p className="col-span-12 flex items-center gap-1.5 border-t pt-3 text-xs text-muted-foreground">
        <LockIcon className="size-3 shrink-0" /> {t("form.addressPrivate")}
      </p>
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
  const t = useT()
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
            <span key={s} className="flex items-center gap-1 rounded-full bg-primary/10 py-0.5 ps-2.5 pe-1 text-sm text-primary">
              {s}
              <button
                type="button"
                aria-label={t("form.removeTag", { tag: s })}
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
            <PlusIcon className="size-3" /> {t("form.addTag", { tag: query.trim() })}
          </button>
        )}
      </div>
    </div>
  )
}

/** Projects and activities: name, optional link, dates and a short description. */
export function ProjectFields({ value, onChange }: { value: Project[]; onChange: (update: (list: Project[]) => Project[]) => void }) {
  const t = useT()
  const update = (id: string, patch: Partial<Project>) => onChange((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  return (
    <div className="space-y-3">
      {value.length === 0 && <p className="text-sm text-muted-foreground">{t("seeker.projectsEmpty")}</p>}
      {value.map((p, i) => (
        <div key={p.id} className="rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t("form.projectN", { n: i + 1 })}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("form.removeProject", { n: i + 1 })}
              onClick={() => onChange((list) => list.filter((x) => x.id !== p.id))}
            >
              <Trash2Icon />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("form.projectName")}>
              <Input className="h-9" value={p.name} onChange={(e) => update(p.id, { name: e.target.value })} placeholder={t("form.projectNamePlaceholder")} />
            </Field>
            <Field label={t("form.linkOptional")}>
              <Input className="h-9" value={p.link} onChange={(e) => update(p.id, { link: e.target.value })} placeholder="https://…" />
            </Field>
            <Field label={t("form.periodOptional")} className="col-span-2">
              <PeriodPicker start={p.start} end={p.end} onChange={(patch) => update(p.id, patch)} endPlaceholder={t("form.endOngoing")} what={t("form.projectEndsBefore")} />
            </Field>
            {projectDuration(p) && (
              <p className="col-span-2 text-end text-sm text-muted-foreground">
                {t("form.duration")} <span className="font-medium text-foreground">{projectDuration(p)}</span>
              </p>
            )}
            <Field label={t("form.descriptionOptional")} className="col-span-2">
              <Textarea
                className="min-h-16 text-sm"
                value={p.description}
                onChange={(e) => update(p.id, { description: e.target.value })}
                placeholder={t("form.projectPlaceholder")}
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
        <PlusIcon /> {t("form.addProject")}
      </Button>
    </div>
  )
}

/** Where the job seeker wants to work. Used for job matching and employers' filters; not shown on the CV. */
export function WorkPreferenceFields({ value, onChange }: { value: WorkPreference; onChange: (v: WorkPreference) => void }) {
  const t = useT()
  // "Local" (cities in Iraq) is on while cities are picked, or once ticked while picking the first one
  const [localTicked, setLocalTicked] = useState(false)
  const local = value.iraqCities.length > 0 || localTicked
  const toggle = (checked: boolean, onToggle: (on: boolean) => void, label: string, hint: string) => (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-sm transition-colors",
        checked ? "border-primary bg-primary/5" : "hover:bg-muted/50"
      )}
    >
      <input type="checkbox" className="mt-0.5 size-4 accent-primary" checked={checked} onChange={(e) => onToggle(e.target.checked)} />
      <span>
        <span className="font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </label>
  )
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {toggle(value.remote, (remote) => onChange({ ...value, remote }), t("form.remote"), t("form.remoteHint"))}
        {toggle(
          local,
          (on) => {
            setLocalTicked(on)
            // Unticking Local clears the cities
            if (!on && value.iraqCities.length) onChange({ ...value, iraqCities: [] })
          },
          t("form.local"),
          t("form.localHint")
        )}
        {toggle(value.international, (international) => onChange({ ...value, international }), t("form.international"), t("form.internationalHint"))}
      </div>
      {local && (
        <Field label={t("form.citiesInIraq")}>
          <TagPicker
            value={value.iraqCities}
            onChange={(iraqCities) => onChange({ ...value, iraqCities })}
            suggestions={IRAQ_CITIES}
            allowCustom={false}
            placeholder={t("form.searchCitiesPlaceholder")}
          />
        </Field>
      )}
    </div>
  )
}
