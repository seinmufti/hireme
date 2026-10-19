"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { CircleAlertIcon, CircleCheckIcon, LinkIcon, MailIcon, PencilIcon, PhoneIcon } from "lucide-react"
import { toast } from "sonner"
import { CertificationList, DegreeList, ExperienceList, LanguageList, portfolioFacts } from "@/components/pool/talent-meta"
import { PhoneInput } from "@/components/phone-input"
import { UserAvatar } from "@/components/user-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ageFrom, highestEducation, totalMonths } from "@/lib/format"
import { ROLE_LABEL } from "@/lib/options"
import { listingSectionsMissing, portfolioEntryProblem, useStore, type ListingSection } from "@/lib/store"
import type { Talent, User } from "@/lib/types"
import { cn } from "@/lib/utils"
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

type SectionId = ListingSection

// Job seeker profile = their portfolio: personal details (full name, gender, date of birth),
// private contact details, languages, degrees, certifications and previous jobs.
export function SeekerProfile({ user }: { user: User }) {
  const talent = useStore((s) => s.talents.find((t) => t.userId === user.id)) ?? null
  const router = useRouter()
  // "?edit=1" (set right after creating an account) opens the portfolio form straight away
  const startEditing = useSearchParams().has("edit")
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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-5">
        <UserAvatar name={user.name} color={user.avatarColor} size={72} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-2xl font-semibold tracking-tight">{user.name}</h1>
            <Badge variant="secondary">{ROLE_LABEL[user.role]}</Badge>
          </div>
        </div>
        <PoolStatus user={user} talent={talent} />
      </div>

      {editing ? (
        <PortfolioForm user={user} talent={talent} jumpTo={jumpTo} onDone={() => setEditing(false)} />
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

  const pill = (
    <span
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium",
        inPool ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-amber-300 bg-amber-50 text-amber-900"
      )}
    >
      {inPool ? <CircleCheckIcon className="size-4" /> : <CircleAlertIcon className="size-4" />}
      {/* Switched on but details still missing: "yet" */}
      {inPool ? "In the pool" : visible ? "Not in the pool yet" : "Not in the pool"}
    </span>
  )

  return (
    <div className="flex shrink-0 items-center gap-3">
      {visible && sections.length ? (
        // Turned on but incomplete: how many sections still need details, on hover
        <Tooltip>
          <TooltipTrigger render={<span tabIndex={0} className="cursor-help rounded-full outline-none" />}>{pill}</TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-64">
            {sections.length} {sections.length === 1 ? "section needs" : "sections need"} required details. Look for the yellow {sections.length === 1 ? "section" : "sections"} below.
          </TooltipContent>
        </Tooltip>
      ) : (
        pill
      )}
      {/* On = visible to employers, off = hidden */}
      <SwitchPrimitive.Root
        checked={visible}
        onCheckedChange={(v) => {
          setPortfolioVisible(v)
          toast.success(v ? "Visible to employers" : "Hidden from employers")
        }}
        aria-label="Show my portfolio in the pool"
        className="group relative inline-flex h-8 w-[4.5rem] shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-input transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-checked:bg-primary"
      >
        <span className="absolute left-2.5 text-[11px] font-semibold text-primary-foreground opacity-0 transition-opacity group-data-checked:opacity-100">
          ON
        </span>
        <span className="absolute right-2 text-[11px] font-semibold text-muted-foreground transition-opacity group-data-checked:opacity-0">
          OFF
        </span>
        <SwitchPrimitive.Thumb className="block size-6 translate-x-1 rounded-full bg-background shadow-sm transition-transform data-checked:translate-x-[2.6rem]" />
      </SwitchPrimitive.Root>
    </div>
  )
}

/** Sections that still need details for The Pool are yellow. */
const NEEDS_DETAILS = "border-amber-300 bg-amber-50"

function Card({
  title,
  onEdit,
  needsDetails,
  children,
}: {
  title: string
  onEdit: () => void
  needsDetails?: boolean
  children: React.ReactNode
}) {
  return (
    <section className={cn("rounded-xl border p-6", needsDetails ? NEEDS_DETAILS : "bg-card")}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className={cn("text-sm font-medium", needsDetails ? "text-amber-900" : "text-muted-foreground")}>
          {title}
          {needsDetails && <span className="ml-2 text-xs font-normal">Required details missing</span>}
        </h2>
        <Button variant="ghost" size="sm" onClick={onEdit} aria-label={`Edit ${title.toLowerCase()}`}>
          <PencilIcon /> Edit
        </Button>
      </div>
      {children}
    </section>
  )
}

function PortfolioView({ user, talent, onEdit }: { user: User; talent: Talent | null; onEdit: (section: SectionId) => void }) {
  const needs = new Set(listingSectionsMissing(user, talent))
  const contact = [
    { icon: PhoneIcon, label: "Phone", value: user.phone, href: user.phone ? `tel:${user.phone.replace(/\s/g, "")}` : "" },
    { icon: MailIcon, label: "Email", value: user.email, href: user.email ? `mailto:${user.email}` : "" },
    { icon: LinkIcon, label: "LinkedIn", value: user.linkedin.replace(/^https?:\/\/(www\.)?/, ""), href: user.linkedin },
  ]
  const p = talent ?? { ...EMPTY_PORTFOLIO, dateOfBirth: "" }
  // Languages and education have their own cards
  const personal = portfolioFacts({
    ...p,
    age: ageFrom(p.dateOfBirth),
    education: highestEducation(p.degrees),
    totalMonths: totalMonths(p.experiences),
  }).filter(
    (f) => f.label !== "Languages" && f.label !== "Education" && f.label !== "Experience"
  )

  return (
    <div className="space-y-4">
      <Card title="Personal details" onEdit={() => onEdit("personal")} needsDetails={needs.has("personal")}>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
          {personal.map((f) => (
            <div key={f.label} className="flex items-center gap-2.5">
              <f.icon className="size-4 shrink-0 text-muted-foreground" />
              <dt className="sr-only">{f.label}</dt>
              <dd className="truncate">
                {f.label === "Age" && p.dateOfBirth
                  ? `${new Date(p.dateOfBirth).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} (${f.value})`
                  : f.value}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card title="Contact" onEdit={() => onEdit("contact")} needsDetails={needs.has("contact")}>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
          {contact.map((c) => (
            <div key={c.label} className={cn("flex items-center gap-3", c.label === "LinkedIn" && "col-span-2")}>
              <c.icon className="size-4 shrink-0 text-muted-foreground" />
              <dt className="sr-only">{c.label}</dt>
              <dd className="min-w-0 truncate">
                {!c.value ? (
                  <span className="text-muted-foreground">No {c.label === "LinkedIn" ? c.label : c.label.toLowerCase()} added</span>
                ) : c.href ? (
                  <a href={c.href} target={c.label === "LinkedIn" ? "_blank" : undefined} rel="noreferrer" className="hover:underline">
                    {c.value}
                  </a>
                ) : (
                  c.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card title="Languages" onEdit={() => onEdit("languages")} needsDetails={needs.has("languages")}>
        <LanguageList languages={p.languages} />
      </Card>

      <Card title="Education" onEdit={() => onEdit("education")} needsDetails={needs.has("education")}>
        <DegreeList degrees={p.degrees} />
      </Card>

      <Card title="Certifications" onEdit={() => onEdit("certifications")} needsDetails={needs.has("certifications")}>
        <CertificationList certifications={p.certifications} />
      </Card>

      <Card title="Work experience" onEdit={() => onEdit("work")} needsDetails={needs.has("work")}>
        <ExperienceList experiences={p.experiences} />
      </Card>
    </div>
  )
}

function PortfolioForm({
  user,
  talent,
  jumpTo,
  onDone,
}: {
  user: User
  talent: Talent | null
  jumpTo: SectionId | null
  onDone: () => void
}) {
  // Opened from a section's Edit button: scroll that section into view
  useEffect(() => {
    if (jumpTo) document.getElementById(`edit-${jumpTo}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [jumpTo])

  const updateProfile = useStore((s) => s.updateProfile)
  const saveTalent = useStore((s) => s.saveTalent)
  const [contact, setContact] = useState({ name: user.name, phone: user.phone, email: user.email, linkedin: user.linkedin })
  const [portfolio, setPortfolio] = useState(() => (talent ? toPortfolioInput(talent) : EMPTY_PORTFOLIO))
  // Follows what's typed: a section turns normal as soon as its required details are in
  const needs = new Set(listingSectionsMissing(contact, portfolio))
  const sectionClass = (id: SectionId) => cn("scroll-mt-20 space-y-4 p-6", needs.has(id) && "bg-amber-50")
  const setField = (key: keyof typeof contact) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setContact((c) => ({ ...c, [key]: e.target.value }))

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    // Drafts are fine; only mistakes block saving. Check the portfolio first so nothing is half-saved.
    const problem = portfolioEntryProblem(portfolio)
    if (problem) return toast.error(problem)

    const profile = updateProfile({ ...contact, title: user.title, company: user.company, city: user.city, bio: user.bio })
    if (!profile.ok) return toast.error(profile.error)
    const saved = saveTalent(portfolio)
    if (!saved.ok) return toast.error(saved.error)

    // What's still missing for The Pool shows in the status at the top of the profile
    toast.success("Portfolio saved")
    onDone()
  }

  return (
    <form onSubmit={save} className="divide-y rounded-xl border bg-card">
      <section id="edit-personal" className={sectionClass("personal")}>
        <h2 className="font-medium">Personal details</h2>
        <Field label="Full name">
          <Input className="h-9" value={contact.name} onChange={setField("name")} />
        </Field>
        <PersonalFields value={portfolio} onChange={setPortfolio} />
      </section>

      <section id="edit-contact" className={sectionClass("contact")}>
        <h2 className="font-medium">Contact</h2>
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
      </section>

      <section id="edit-languages" className={sectionClass("languages")}>
        <h2 className="font-medium">Languages</h2>
        <LanguageFields
          value={portfolio.languages}
          onChange={(update) => setPortfolio((p) => ({ ...p, languages: update(p.languages) }))}
        />
      </section>

      <section id="edit-education" className={sectionClass("education")}>
        <h2 className="font-medium">Education</h2>
        <DegreeFields
          value={portfolio.degrees}
          onChange={(update) => setPortfolio((p) => ({ ...p, degrees: update(p.degrees) }))}
        />
      </section>

      <section id="edit-certifications" className={sectionClass("certifications")}>
        <div>
          <h2 className="font-medium">Certifications</h2>
          <p className="text-sm text-muted-foreground">Optional.</p>
        </div>
        <CertificationFields
          value={portfolio.certifications}
          onChange={(update) => setPortfolio((p) => ({ ...p, certifications: update(p.certifications) }))}
        />
      </section>

      <section id="edit-work" className={sectionClass("work")}>
        <div>
          <h2 className="font-medium">Work experience</h2>
          <p className="text-sm text-muted-foreground">List your previous jobs, most recent first.</p>
        </div>
        <ExperienceFields
          value={portfolio.experiences}
          onChange={(update) => setPortfolio((p) => ({ ...p, experiences: update(p.experiences) }))}
        />
      </section>

      <div className="sticky bottom-0 flex justify-end gap-2 rounded-b-xl bg-card/95 p-4 backdrop-blur">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  )
}
