"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import {
  BriefcaseIcon,
  CakeIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  EyeIcon,
  GlobeIcon,
  HomeIcon,
  LinkIcon,
  LockIcon,
  MailIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  UserIcon,
  UserRoundCheckIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Flag, ProfilePhoto } from "@/components/cv/photo"
import { CertificationList, DegreeList, ExperienceList, LanguageList } from "@/components/pool/talent-meta"
import { PhoneInput } from "@/components/phone-input"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { deleteFile } from "@/lib/files"
import { ageFrom, formatDuration, formatMonthYear, totalMonths } from "@/lib/format"
import { countryName, HARD_SKILLS, SOFT_SKILLS } from "@/lib/options"
import { listingSectionsMissing, portfolioEntryProblem, useStore, type ListingSection } from "@/lib/store"
import type { Talent, TalentInput, User } from "@/lib/types"
import { cn } from "@/lib/utils"
import { AttachmentThumb, LocationFields, PhotoField, ProjectFields, TagPicker, WorkPreferenceFields } from "./cv-fields"
import {
  CertificationFields,
  DegreeFields,
  EMPTY_PORTFOLIO,
  ExperienceFields,
  Field,
  LanguageFields,
  PersonalFields,
  toPortfolioInput,
} from "./portfolio-fields"

type SectionId = ListingSection | "preference"

// Sections in CV order, as they appear on the profile, in the form and on the CV
const SECTION_TITLES: Record<SectionId, string> = {
  personal: "Personal details & contact",
  about: "About me",
  work: "Work experience",
  education: "Education",
  skills: "Core competencies",
  languages: "Languages",
  certifications: "Licenses & certifications",
  projects: "Projects & activities",
  preference: "Work I'm looking for",
}

// Job seeker profile = their CV: personal and contact details, about me, work experience, education,
// skills, languages, licenses, projects, and the kind of work they want (for matching only).
export function SeekerProfile({ user }: { user: User }) {
  const talent = useStore((s) => s.talents.find((t) => t.userId === user.id)) ?? null
  const router = useRouter()
  // "?edit=1" (right after creating an account, or from the CV preview's Edit button) opens the form straight away
  const params = useSearchParams()
  const startEditing = params.has("edit")
  const [editing, setEditing] = useState(startEditing)
  // Which form section to scroll to when editing starts from a section's Edit button
  const [jumpTo, setJumpTo] = useState<SectionId | null>(null)
  const edit = (section: SectionId) => {
    setJumpTo(section)
    setEditing(true)
  }
  useEffect(() => {
    if (startEditing) router.replace("/profile")
  }, [startEditing, router])

  const location = [user.city, countryName(user.country)].filter(Boolean).join(", ")

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-5">
        <ProfilePhoto photoId={user.photoId} name={user.name} color={user.avatarColor} size={72} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{user.name}</h1>
          {user.title ? (
            <p className="truncate text-muted-foreground">{user.title}</p>
          ) : (
            <p className="truncate text-sm text-muted-foreground italic">Add your profession under your name</p>
          )}
          {location && (
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Flag code={user.country} /> {location}
            </p>
          )}
        </div>
        {!editing && (
          <Link href="/profile/cv" className={buttonVariants({ variant: "default" })}>
            <EyeIcon /> Preview CV
          </Link>
        )}
      </div>

      <PoolStatus user={user} talent={talent} />

      {editing ? (
        <PortfolioForm user={user} talent={talent} jumpTo={jumpTo} onCancel={() => setEditing(false)} />
      ) : (
        <PortfolioView user={user} talent={talent} onEdit={edit} />
      )}
    </div>
  )
}

/** The only place the Pool status and the visibility switch appear. */
function PoolStatus({ user, talent }: { user: User; talent: Talent | null }) {
  const setPortfolioVisible = useStore((s) => s.setPortfolioVisible)
  const sections = listingSectionsMissing(user, talent)
  const visible = talent?.published ?? true
  const inPool = visible && sections.length === 0

  const status = (
    <span
      className={cn(
        "flex items-center gap-1.5 text-sm font-medium",
        inPool ? "text-emerald-900" : "text-amber-900"
      )}
    >
      {inPool ? <CircleCheckIcon className="size-4" /> : <CircleAlertIcon className="size-4" />}
      {/* Switched on but details still missing: not visible yet */}
      {inPool
        ? "Your profile is visible to employers"
        : visible
          ? "Your profile isn't visible to employers yet"
          : "Your profile is hidden from employers"}
    </span>
  )

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5",
        inPool ? "border-emerald-300 bg-emerald-50" : "border-amber-300 bg-amber-50"
      )}
    >
      {visible && sections.length ? (
        // Turned on but incomplete: how many sections still need details, on hover
        <Tooltip>
          <TooltipTrigger render={<span tabIndex={0} className="cursor-help rounded outline-none" />}>{status}</TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-64">
            Required details missing in: {sections.map((s) => SECTION_TITLES[s]).join(", ")}.
          </TooltipContent>
        </Tooltip>
      ) : (
        status
      )}
      {/* On = visible to employers, off = hidden */}
      <SwitchPrimitive.Root
        checked={visible}
        onCheckedChange={(v) => {
          setPortfolioVisible(v)
          toast.success(v ? "Your profile is visible to employers" : "Your profile is hidden from employers")
        }}
        aria-label="Your profile is visible to employers"
        className="group relative inline-flex h-7 w-16 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-input transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-checked:bg-primary"
      >
        <span className="absolute left-2 text-[10px] font-semibold text-primary-foreground opacity-0 transition-opacity group-data-checked:opacity-100">
          ON
        </span>
        <span className="absolute right-1.5 text-[10px] font-semibold text-muted-foreground transition-opacity group-data-checked:opacity-0">
          OFF
        </span>
        <SwitchPrimitive.Thumb className="block size-5 translate-x-1 rounded-full bg-background shadow-sm transition-transform data-checked:translate-x-[2.4rem]" />
      </SwitchPrimitive.Root>
    </div>
  )
}

/** Sections that still need details for The Pool are yellow. */
const NEEDS_DETAILS = "border-amber-300 bg-amber-50"

function Card({
  id,
  onEdit,
  needsDetails,
  note,
  children,
}: {
  id: SectionId
  onEdit: (section: SectionId) => void
  needsDetails?: boolean
  note?: React.ReactNode
  children: React.ReactNode
}) {
  const title = SECTION_TITLES[id]
  return (
    <section className={cn("rounded-xl border p-6", needsDetails ? NEEDS_DETAILS : "bg-card")}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className={cn("text-sm font-medium", needsDetails ? "text-amber-900" : "text-muted-foreground")}>
          {title}
          {needsDetails && <span className="ml-2 text-xs font-normal">Required details missing</span>}
          {note && <span className="ml-2 text-xs font-normal">{note}</span>}
        </h2>
        <Button variant="ghost" size="sm" onClick={() => onEdit(id)} aria-label={`Edit ${title.toLowerCase()}`}>
          <PencilIcon /> Edit
        </Button>
      </div>
      {children}
    </section>
  )
}

const Empty = ({ children }: { children: React.ReactNode }) => <p className="text-sm text-muted-foreground">{children}</p>

function Attachments({ ids }: { ids: string[] }) {
  if (!ids.length) return null
  return (
    <div className="mt-1.5 flex flex-wrap gap-2">
      {ids.map((id) => (
        <AttachmentThumb key={id} id={id} />
      ))}
    </div>
  )
}

function PortfolioView({ user, talent, onEdit }: { user: User; talent: Talent | null; onEdit: (section: SectionId) => void }) {
  const needs = new Set(listingSectionsMissing(user, talent))
  const p = talent ?? EMPTY_PORTFOLIO
  const age = ageFrom(p.dateOfBirth)
  const months = totalMonths(p.experiences)
  const location = [user.city, countryName(user.country)].filter(Boolean).join(", ")
  const details = [
    { icon: UserIcon, label: "Gender", value: p.gender },
    {
      icon: CakeIcon,
      label: "Date of birth",
      value: p.dateOfBirth
        ? `${new Date(p.dateOfBirth).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} (${age} years old)`
        : "",
    },
    { icon: PhoneIcon, label: "Phone", value: user.phone, href: user.phone ? `tel:${user.phone.replace(/\s/g, "")}` : "" },
    { icon: MailIcon, label: "Email", value: user.email, href: user.email ? `mailto:${user.email}` : "" },
    { icon: MapPinIcon, label: "Location", value: location, flag: user.country },
    { icon: HomeIcon, label: "Address", value: user.address, private: true },
    { icon: LinkIcon, label: "LinkedIn", value: user.linkedin.replace(/^https?:\/\/(www\.)?/, ""), href: user.linkedin },
  ]
  const pref = p.workPreference
  const prefs = [pref.remote && "Remote", pref.international && "International", ...pref.iraqCities].filter(Boolean)

  return (
    <div className="space-y-4">
      <Card id="personal" onEdit={onEdit} needsDetails={needs.has("personal")}>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
          {details.map((d) => (
            <div key={d.label} className="flex min-w-0 items-center gap-2.5" title={d.label}>
              <d.icon className="size-4 shrink-0 text-muted-foreground" />
              <dt className="sr-only">{d.label}</dt>
              <dd className="flex min-w-0 items-center gap-1.5">
                {!d.value ? (
                  <span className="text-muted-foreground">No {d.label.toLowerCase()} added</span>
                ) : (
                  <>
                    {d.flag && <Flag code={d.flag} />}
                    {d.href ? (
                      <a href={d.href} target={d.label === "LinkedIn" ? "_blank" : undefined} rel="noreferrer" className="truncate hover:underline">
                        {d.value}
                      </a>
                    ) : (
                      <span className="truncate">{d.value}</span>
                    )}
                    {d.private && <LockIcon className="size-3 shrink-0 text-muted-foreground" aria-label="Only on your own CV" />}
                  </>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card id="about" onEdit={onEdit}>
        {p.summary ? <p className="text-sm whitespace-pre-line">{p.summary}</p> : <Empty>A few sentences about you, your experience and what you&apos;re looking for.</Empty>}
      </Card>

      <Card id="work" onEdit={onEdit} needsDetails={needs.has("work")} note={months > 0 && `${formatDuration(months)} in total`}>
        {p.experiences.length === 0 ? (
          <Empty>No previous jobs listed.</Empty>
        ) : (
          <ol className="space-y-4">
            {p.experiences.map((e) => (
              <li key={e.id}>
                <ExperienceList experiences={[e]} />
                {e.description && (
                  <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-sm marker:text-primary">
                    {e.description.split("\n").map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                )}
                {e.reference && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <UserRoundCheckIcon className="size-3.5" /> Reference: {e.reference.name}
                    {e.reference.position && `, ${e.reference.position}`} (shown as &ldquo;available on request&rdquo;)
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card id="education" onEdit={onEdit} needsDetails={needs.has("education")}>
        <div className="space-y-3">
          {p.degrees.length === 0 && <DegreeList degrees={[]} />}
          {p.degrees.map((d) => (
            <div key={d.id}>
              <DegreeList degrees={[d]} />
              <Attachments ids={d.attachmentIds} />
            </div>
          ))}
        </div>
      </Card>

      <Card id="skills" onEdit={onEdit}>
        {p.hardSkills.length + p.softSkills.length === 0 ? (
          <Empty>Add your hard skills (e.g. Excel, AutoCAD) and soft skills (e.g. Teamwork).</Empty>
        ) : (
          <div className="grid grid-cols-2 gap-6 text-sm">
            {[
              ["Hard skills", p.hardSkills],
              ["Soft skills", p.softSkills],
            ].map(([title, list]) => (
              <div key={title as string}>
                <h3 className="mb-1 text-xs font-medium text-muted-foreground">{title}</h3>
                {(list as string[]).length ? (
                  <ul className="list-disc space-y-0.5 pl-5 marker:text-primary">
                    {(list as string[]).map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                ) : (
                  <Empty>None added</Empty>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card id="languages" onEdit={onEdit} needsDetails={needs.has("languages")}>
        <LanguageList languages={p.languages} />
        {p.languages.some((l) => l.attachmentIds.length) && (
          <div className="mt-3 space-y-2 border-t pt-3">
            {p.languages
              .filter((l) => l.attachmentIds.length)
              .map((l) => (
                <div key={l.language} className="text-sm">
                  <span className="text-xs text-muted-foreground">{l.language} certificate</span>
                  <Attachments ids={l.attachmentIds} />
                </div>
              ))}
          </div>
        )}
      </Card>

      <Card id="certifications" onEdit={onEdit} needsDetails={needs.has("certifications")}>
        <div className="space-y-3">
          {p.certifications.length === 0 && <CertificationList certifications={[]} />}
          {p.certifications.map((c) => (
            <div key={c.id}>
              <CertificationList certifications={[c]} />
              <Attachments ids={c.attachmentIds} />
            </div>
          ))}
        </div>
      </Card>

      <Card id="projects" onEdit={onEdit} needsDetails={needs.has("projects")}>
        {p.projects.length === 0 ? (
          <Empty>No projects or activities added. They&apos;re optional.</Empty>
        ) : (
          <ol className="space-y-3 text-sm">
            {p.projects.map((x) => (
              <li key={x.id}>
                <div className="font-medium">{x.name || <span className="text-muted-foreground italic">Name not added</span>}</div>
                <div className="text-xs text-muted-foreground">
                  {[x.start && formatMonthYear(x.start), x.start && (x.end ? formatMonthYear(x.end) : "Ongoing")].filter(Boolean).join(" – ")}
                  {x.link && (
                    <a href={x.link} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-1 text-primary hover:underline">
                      <GlobeIcon className="size-3" /> {x.link.replace(/^https?:\/\/(www\.)?/, "")}
                    </a>
                  )}
                </div>
                {x.description && <p className="mt-0.5">{x.description}</p>}
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card id="preference" onEdit={onEdit} note={<>· <LockIcon className="inline size-3" /> for job matching, not on your CV</>}>
        {prefs.length ? (
          <div className="flex flex-wrap gap-1.5">
            {prefs.map((x) => (
              <span key={x as string} className="flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-sm">
                <BriefcaseIcon className="size-3.5 text-muted-foreground" /> {x}
              </span>
            ))}
          </div>
        ) : (
          <Empty>Choose remote, international, or cities in Iraq, so we can show you matching jobs.</Empty>
        )}
      </Card>
    </div>
  )
}

/** Every uploaded file the portfolio refers to. */
const fileIds = (p: TalentInput, photoId: string) => [
  photoId,
  ...p.degrees.flatMap((d) => d.attachmentIds),
  ...p.certifications.flatMap((c) => c.attachmentIds),
  ...p.languages.flatMap((l) => l.attachmentIds),
]

function PortfolioForm({
  user,
  talent,
  jumpTo,
  onCancel,
}: {
  user: User
  talent: Talent | null
  jumpTo: SectionId | null
  onCancel: () => void
}) {
  const router = useRouter()
  // Opened from a section's Edit button: scroll that section into view
  useEffect(() => {
    if (jumpTo) document.getElementById(`edit-${jumpTo}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [jumpTo])

  const updateProfile = useStore((s) => s.updateProfile)
  const saveTalent = useStore((s) => s.saveTalent)
  const [contact, setContact] = useState({
    name: user.name,
    title: user.title,
    phone: user.phone,
    email: user.email,
    linkedin: user.linkedin,
    photoId: user.photoId,
    country: user.country || "IQ",
    city: user.city,
    address: user.address,
  })
  const [portfolio, setPortfolio] = useState(() => (talent ? toPortfolioInput(talent) : EMPTY_PORTFOLIO))
  // Files that were stored when the form opened; the rest were uploaded while editing
  const savedFiles = useRef(new Set(fileIds(talent ?? EMPTY_PORTFOLIO, user.photoId).filter(Boolean)))
  // Follows what's typed: a section turns normal as soon as its required details are in
  const needs = new Set(listingSectionsMissing(contact, portfolio))
  const sectionClass = (id: SectionId) => cn("scroll-mt-20 space-y-4 p-6", needs.has(id as ListingSection) && "bg-amber-50")
  const setField = (key: keyof typeof contact) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setContact((c) => ({ ...c, [key]: e.target.value }))
  const list = <K extends "experiences" | "degrees" | "certifications" | "languages" | "projects">(key: K) =>
    (update: (l: TalentInput[K]) => TalentInput[K]) => setPortfolio((p) => ({ ...p, [key]: update(p[key]) }))

  const cleanUpFiles = (keep: string[]) => {
    const keepSet = new Set(keep)
    // Uploaded but not kept, or removed from the saved portfolio
    for (const id of fileIds(portfolio, contact.photoId)) if (id && !keepSet.has(id)) deleteFile(id).catch(() => {})
    for (const id of savedFiles.current) if (!keepSet.has(id)) deleteFile(id).catch(() => {})
  }

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    // Drafts are fine; only mistakes block saving. Check the portfolio first so nothing is half-saved.
    const problem = portfolioEntryProblem(portfolio)
    if (problem) return toast.error(problem)

    const profile = updateProfile({ ...contact, company: user.company, bio: user.bio })
    if (!profile.ok) return toast.error(profile.error)
    const saved = saveTalent(portfolio)
    if (!saved.ok) return toast.error(saved.error)
    cleanUpFiles(fileIds(portfolio, contact.photoId))

    // What's still missing for The Pool shows in the status at the top of the profile
    toast.success("Your CV is ready")
    router.push("/profile/cv")
  }

  const cancel = () => {
    cleanUpFiles([...savedFiles.current])
    onCancel()
  }

  const heading = (id: SectionId, hint?: string) => (
    <div>
      <h2 className="font-medium">{SECTION_TITLES[id]}</h2>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  )

  return (
    <form onSubmit={save} className="divide-y rounded-xl border bg-card">
      <section id="edit-personal" className={sectionClass("personal")}>
        {heading("personal")}
        <PhotoField
          photoId={contact.photoId}
          name={contact.name}
          color={user.avatarColor}
          onChange={(photoId) => setContact((c) => ({ ...c, photoId }))}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full name">
            <Input className="h-9" value={contact.name} onChange={setField("name")} />
          </Field>
          <Field label="Profession (shown under your name)">
            <Input className="h-9" value={contact.title} onChange={setField("title")} placeholder="e.g. Accountant, Civil Engineer" />
          </Field>
        </div>
        <PersonalFields value={portfolio} onChange={setPortfolio} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone number">
            <PhoneInput value={contact.phone} onChange={(phone) => setContact((c) => ({ ...c, phone }))} />
          </Field>
          <Field label="Email">
            <Input className="h-9" type="email" value={contact.email} onChange={setField("email")} placeholder="name@example.com" />
          </Field>
          <Field label="LinkedIn (optional)" className="col-span-2">
            <Input className="h-9" value={contact.linkedin} onChange={setField("linkedin")} placeholder="https://linkedin.com/in/…" />
          </Field>
        </div>
        <LocationFields
          value={contact}
          onChange={(patch) => setContact((c) => ({ ...c, ...patch }))}
        />
        <p className="text-xs text-muted-foreground">
          Employers never see your phone, email, LinkedIn or address. They contact you through HireMe messages.
        </p>
      </section>

      <section id="edit-about" className={sectionClass("about")}>
        {heading("about", "Optional. 2–4 sentences: who you are, your experience, and what you're looking for.")}
        <Textarea
          className="min-h-24 text-sm"
          value={portfolio.summary}
          onChange={(e) => setPortfolio((p) => ({ ...p, summary: e.target.value }))}
          placeholder="e.g. Accountant with 5 years of experience in construction companies in Erbil…"
        />
      </section>

      <section id="edit-work" className={sectionClass("work")}>
        {heading("work", "List your previous jobs, most recent first.")}
        <ExperienceFields value={portfolio.experiences} onChange={list("experiences")} />
      </section>

      <section id="edit-education" className={sectionClass("education")}>
        {heading("education")}
        <DegreeFields value={portfolio.degrees} onChange={list("degrees")} />
      </section>

      <section id="edit-skills" className={sectionClass("skills")}>
        {heading("skills", "Pick from the suggestions or write your own. They show as bullet points on your CV.")}
        <Field label="Hard skills (tools, methods, technical knowledge)">
          <TagPicker
            value={portfolio.hardSkills}
            onChange={(hardSkills) => setPortfolio((p) => ({ ...p, hardSkills }))}
            suggestions={HARD_SKILLS}
            placeholder="Search or write a skill, e.g. Excel"
          />
        </Field>
        <Field label="Soft skills (how you work with people)">
          <TagPicker
            value={portfolio.softSkills}
            onChange={(softSkills) => setPortfolio((p) => ({ ...p, softSkills }))}
            suggestions={SOFT_SKILLS}
            placeholder="Search or write a skill, e.g. Teamwork"
          />
        </Field>
      </section>

      <section id="edit-languages" className={sectionClass("languages")}>
        {heading("languages")}
        <LanguageFields value={portfolio.languages} onChange={list("languages")} />
      </section>

      <section id="edit-certifications" className={sectionClass("certifications")}>
        {heading("certifications", "Optional. Upload a scan of each one if you have it.")}
        <CertificationFields value={portfolio.certifications} onChange={list("certifications")} />
      </section>

      <section id="edit-projects" className={sectionClass("projects")}>
        {heading("projects", "Optional. Personal projects, volunteering, clubs and other activities.")}
        <ProjectFields value={portfolio.projects} onChange={list("projects")} />
      </section>

      <section id="edit-preference" className={sectionClass("preference")}>
        {heading("preference", "Used to match you with jobs. It isn't shown on your CV.")}
        <WorkPreferenceFields
          value={portfolio.workPreference}
          onChange={(workPreference) => setPortfolio((p) => ({ ...p, workPreference }))}
        />
      </section>

      <div className="sticky bottom-0 flex items-center justify-end gap-2 rounded-b-xl bg-card/95 p-4 backdrop-blur">
        <span className="mr-auto text-xs text-muted-foreground">Ready saves your details and shows your CV.</span>
        <Button type="button" variant="ghost" onClick={cancel}>
          Cancel
        </Button>
        <Button type="submit">
          <CircleCheckIcon /> Ready
        </Button>
      </div>
    </form>
  )
}
