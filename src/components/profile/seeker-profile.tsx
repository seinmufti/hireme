"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  AwardIcon,
  BriefcaseIcon,
  CakeIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  EyeIcon,
  FileTextIcon,
  FolderKanbanIcon,
  LoaderCircleIcon,
  GlobeIcon,
  GraduationCapIcon,
  HomeIcon,
  IdCardIcon,
  LanguagesIcon,
  LinkIcon,
  LockIcon,
  MailIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  UserIcon,
  UserRoundCheckIcon,
  WrenchIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Flag, ProfilePhoto } from "@/components/cv/photo"
import { CertificationList, DegreeList, ExperienceList, LanguageList } from "@/components/pool/talent-meta"
import { PhoneInput } from "@/components/phone-input"
import { CvStrengthBar } from "@/components/cv-strength-bar"
import { CvImportButton } from "@/components/profile/cv-import-dialog"
import { sectionsToCheck } from "@/components/profile/cv-import-review"
import { stillMissing } from "@/lib/cv-import"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { deleteFile, saveUpload } from "@/lib/files"
import { ageFrom, formatDuration, formatMonthYear, projectDuration, totalMonths } from "@/lib/format"
import { countryName, HARD_SKILLS, SOFT_SKILLS } from "@/lib/options"
import { useT } from "@/i18n/provider"
import type { Translate } from "@/i18n/translate"
import { certificationComplete, degreeComplete, filled, jobComplete, listingSectionsMissing, sectionsMissingEntries, portfolioEntryProblem, useStore, type ListingSection } from "@/lib/store"
import type { Talent, TalentInput, User } from "@/lib/types"
import { cn } from "@/lib/utils"
import { WithBrand } from "@/components/brand-name"
import { AttachmentThumb, LocationFields, PhotoField, ProjectFields, TagPicker } from "./cv-fields"
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
/** Where the form can open: a section, or the profession field in the personal section. */
export type EditTarget = SectionId | "profession"
const EDIT_TARGETS: EditTarget[] = ["personal", "about", "work", "education", "skills", "languages", "certifications", "projects", "profession"]

// Sections in CV order, as they appear on the profile and in the form
const sectionTitle = (t: Translate, id: SectionId) => t(`seeker.sections.${id}`)

// Job seeker profile = their CV: personal and contact details, about me, work experience, education,
// skills, languages, licenses, projects, and the kind of work they want (for matching only).
// `embedded`: shown inside the Profile tab, which has its own title and side panels (no Categories list)
export function SeekerProfile({ user, embedded = false }: { user: User; embedded?: boolean }) {
  const talent = useStore((s) => s.talents.find((x) => x.userId === user.id)) ?? null
  const router = useRouter()
  const pathname = usePathname()
  const t = useT()
  // For job seekers this page is their CV (the same route is "Profile" for employers and recruiters)
  useEffect(() => {
    if (!embedded) document.title = `${t("nav.cvPreview")} · HireMe`
  }, [t, embedded])
  // "?edit=1" (right after creating an account, or from the CV preview's Edit button) opens the form straight away
  const params = useSearchParams()
  const startEditing = params.has("edit")
  const startAt = EDIT_TARGETS.find((x) => x === params.get("edit")) ?? null
  const [editing, setEditing] = useState(startEditing)
  // Which form section to scroll to when editing starts from a section's Edit button or a link (?edit=work)
  const [jumpTo, setJumpTo] = useState<EditTarget | null>(startAt)
  const [imported, setImported] = useState<Imported | null>(null)
  // A link with ?edit while the CV is already open (e.g. Edit in the Profile tab's Actions) opens the form too
  const editParam = params.get("edit")
  const [seenEditParam, setSeenEditParam] = useState(editParam)
  if (editParam !== seenEditParam) {
    setSeenEditParam(editParam)
    if (editParam !== null) {
      setJumpTo(startAt)
      setEditing(true)
    }
  }
  const edit = (section: SectionId) => {
    setJumpTo(section)
    setEditing(true)
  }
  useEffect(() => {
    // Keep the scroll position: the form may be scrolling to a section (?edit=work)
    if (startEditing) router.replace(pathname, { scroll: false })
  }, [startEditing, router, pathname])

  const location = [user.city, countryName(user.country)].filter(Boolean).join(", ")
  // In the Profile tab, reading the CV: one card, its parts split by lines. Editing keeps a card per section.
  const flat = embedded && !editing

  const header = (
    <>
      <div className="flex items-center gap-5">
        <PhotoWithPencil user={user} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{user.name}</h1>
          {user.title ? (
            <p className="truncate text-muted-foreground">{user.title}</p>
          ) : (
            <p className="truncate text-sm text-muted-foreground italic">{t("seeker.addProfession")}</p>
          )}
          {location && (
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Flag code={user.country} /> {location}
            </p>
          )}
        </div>
      </div>
      <PoolStatus user={user} talent={talent} />
    </>
  )
  // CV strength: the next thing to add opens the form there
  const strength = <CvStrengthBar user={user} talent={talent} skipPhoto />
  // Preview CV: a round floating button with an eye, bottom corner (Dev tools sits in the middle)
  const preview = !editing && (
    <Link
      href="/profile/cv"
      aria-label={t("seeker.previewCv")}
      title={t("seeker.previewCv")}
      className="fixed end-4 bottom-[calc(9rem+env(safe-area-inset-bottom))] z-40 flex size-14 lg:end-6 lg:bottom-[calc(1.5rem+env(safe-area-inset-bottom))] items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/15 transition hover:scale-105 hover:shadow-xl"
    >
      <EyeIcon className="size-6" />
    </Link>
  )

  // Import from a CV file lives in the form (see PortfolioForm), not on the CV itself
  if (flat) {
    return (
      <>
        {preview}
        <div className="mx-auto max-w-3xl divide-y rounded-xl border bg-card">
          <div className="space-y-4 p-6">{header}</div>
          <div className="px-6 py-5">{strength}</div>
          <PortfolioView user={user} talent={talent} onEdit={edit} flat />
        </div>
      </>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {!embedded && <Contents editing={editing} />}
      {header}
      {preview}
      {!editing && <div className="rounded-xl border bg-card px-5 py-4">{strength}</div>}

      {editing ? (
        <PortfolioForm
          user={user}
          talent={talent}
          jumpTo={jumpTo}
          imported={imported}
          onCancel={() => {
            setEditing(false)
            setImported(null)
          }}
          onSaved={() => {
            setImported(null)
            // Back to the CV page, from the top
            setEditing(false)
            window.scrollTo({ top: 0 })
          }}
        />
      ) : (
        <PortfolioView user={user} talent={talent} onEdit={edit} />
      )}
    </div>
  )
}

/** Whether employers can see the profile. There's no switch: it's visible once every required detail is in. */
function PoolStatus({ user, talent }: { user: User; talent: Talent | null }) {
  const t = useT()
  const sections = listingSectionsMissing(user, talent)
  const inPool = sections.length === 0
  // Required details missing, one bullet per section
  const missing = (
    <>
      {t("seeker.missingIn")}
      <ul className="mt-1 list-disc space-y-0.5 ps-4">
        {sections.map((s) => (
          <li key={s}>{sectionTitle(t, s)}</li>
        ))}
      </ul>
    </>
  )

  const status = (
    <span className={cn("flex items-center gap-1.5 text-sm font-medium", inPool ? "text-emerald-900" : "text-amber-900")}>
      {inPool ? <CircleCheckIcon className="size-4" /> : <CircleAlertIcon className="size-4" />}
      {inPool ? t("seeker.visible") : t("seeker.hidden")}
    </span>
  )

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-xl border px-4 py-2.5",
        inPool ? "border-emerald-300 bg-emerald-50" : "border-amber-300 bg-amber-50"
      )}
    >
      <div>
        {status}
        {/* What's still needed, under the status */}
        {sections.length > 0 && <div className="mt-1.5 ps-5.5 text-sm text-amber-900">{missing}</div>}
      </div>
    </div>
  )
}

/** Sections that still need details for the Pool are yellow. */
const NEEDS_DETAILS = "border-amber-300 bg-amber-50"

function Card({
  id,
  onEdit,
  needsDetails,
  flat = false,
  note,
  children,
}: {
  id: SectionId
  onEdit: (section: SectionId) => void
  needsDetails?: boolean
  /** Inside the one CV card: no border of its own (the card draws lines between sections) */
  flat?: boolean
  note?: React.ReactNode
  children: React.ReactNode
}) {
  const t = useT()
  const title = sectionTitle(t, id)
  return (
    <section
      id={`cv-${id}`}
      className={cn(
        "scroll-mt-20 p-6",
        flat ? cn("last:rounded-b-xl", needsDetails && "bg-amber-50") : cn("rounded-xl border", needsDetails ? NEEDS_DETAILS : "bg-card")
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className={cn("text-sm font-medium", needsDetails ? "text-amber-900" : "text-muted-foreground")}>
          {title}
          {needsDetails && <span className="ms-2 text-xs font-normal">{t("seeker.requiredMissing")}</span>}
          {note && <span className="ms-2 text-xs font-normal">{note}</span>}
        </h2>
        <Button variant="ghost" size="sm" onClick={() => onEdit(id)} aria-label={t("seeker.editSection", { section: title })}>
          <PencilIcon /> {t("common.edit")}
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

function PortfolioView({ user, talent, onEdit, flat = false }: { user: User; talent: Talent | null; onEdit: (section: SectionId) => void; flat?: boolean }) {
  const t = useT()
  // A whole section is yellow only when it needs an entry it doesn't have (no degree, no language);
  // otherwise just the incomplete job, degree, license, project or detail is
  const needs = new Set(sectionsMissingEntries(talent))
  const p = talent ?? EMPTY_PORTFOLIO
  const item = (incomplete: boolean) => cn(incomplete && "-mx-2 rounded-lg px-2 py-1.5 ring-1 ring-amber-300 bg-amber-50")
  const age = ageFrom(p.dateOfBirth)
  const months = totalMonths(p.experiences)
  const location = [user.city, countryName(user.country)].filter(Boolean).join(", ")
  const details = [
    { icon: UserIcon, label: t("seeker.gender"), value: p.gender, required: true },
    {
      icon: CakeIcon,
      label: t("seeker.dateOfBirth"),
      value: p.dateOfBirth
        ? `${new Date(p.dateOfBirth).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} (${t("seeker.yearsOld", { age: age ?? "" })})`
        : "",
      required: true,
    },
    { icon: PhoneIcon, label: t("seeker.phone"), value: user.phone, href: user.phone ? `tel:${user.phone.replace(/\s/g, "")}` : "", required: true },
    { icon: MailIcon, label: t("seeker.email"), value: user.email, href: user.email ? `mailto:${user.email}` : "", required: true },
    { icon: MapPinIcon, label: t("seeker.location"), value: location, flag: user.country },
    { icon: HomeIcon, label: t("seeker.address"), value: user.address, private: true },
    { icon: LinkIcon, label: t("seeker.linkedin"), value: user.linkedin.replace(/^https?:\/\/(www\.)?/, ""), href: user.linkedin, external: true },
  ]

  return (
    <div className={flat ? "divide-y" : "space-y-4"}>
      <Card id="personal" flat={flat} onEdit={onEdit}>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
          {details.map((d) => (
            <div key={d.label} className={cn("flex min-w-0 items-center gap-2.5", item(!!d.required && !d.value))} title={d.label}>
              <d.icon className="size-4 shrink-0 text-muted-foreground" />
              <dt className="sr-only">{d.label}</dt>
              <dd className="flex min-w-0 items-center gap-1.5">
                {!d.value ? (
                  <span className="text-muted-foreground">{d.label}: {t("seeker.notAdded")}</span>
                ) : (
                  <>
                    {d.flag && <Flag code={d.flag} />}
                    {d.href ? (
                      <a href={d.href} target={d.external ? "_blank" : undefined} rel="noreferrer" className="truncate hover:underline">
                        {d.value}
                      </a>
                    ) : (
                      <span className="truncate">{d.value}</span>
                    )}
                    {d.private && <LockIcon className="size-3 shrink-0 text-muted-foreground" aria-label={t("seeker.onlyOnYourCv")} />}
                  </>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card id="about" flat={flat} onEdit={onEdit}>
        {p.summary ? <p className="text-sm whitespace-pre-line">{p.summary}</p> : <Empty>{t("seeker.aboutEmpty")}</Empty>}
      </Card>

      <Card id="work" flat={flat} onEdit={onEdit} note={months > 0 && t("seeker.inTotal", { duration: formatDuration(months) })}>
        {p.experiences.length === 0 ? (
          <Empty>{t("seeker.noJobs")}</Empty>
        ) : (
          <ol className="space-y-4">
            {p.experiences.map((e) => (
              <li key={e.id} className={item(!jobComplete(e))}>
                <ExperienceList experiences={[e]} />
                {e.description && (
                  <ul className="mt-1.5 list-disc space-y-0.5 ps-5 text-sm marker:text-primary">
                    {e.description.split("\n").map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                )}
                {e.reference && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <UserRoundCheckIcon className="size-3.5" /> {t("seeker.reference", { name: e.reference.name })}
                    {e.reference.position && `, ${e.reference.position}`} {t("seeker.referenceNote")}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card id="education" flat={flat} onEdit={onEdit} needsDetails={needs.has("education")}>
        <div className="space-y-3">
          {p.degrees.length === 0 && <DegreeList degrees={[]} />}
          {p.degrees.map((d) => (
            <div key={d.id} className={item(!degreeComplete(d))}>
              <DegreeList degrees={[d]} />
              <Attachments ids={d.attachmentIds} />
            </div>
          ))}
        </div>
      </Card>

      <Card id="skills" flat={flat} onEdit={onEdit}>
        {p.hardSkills.length + p.softSkills.length === 0 ? (
          <Empty>{t("seeker.skillsEmpty")}</Empty>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            {[
              [t("seeker.hardSkills"), p.hardSkills],
              [t("seeker.softSkills"), p.softSkills],
            ].map(([title, list]) => (
              <div key={title as string}>
                <h3 className="mb-1 text-xs font-medium text-muted-foreground">{title}</h3>
                {(list as string[]).length ? (
                  <ul className="list-disc space-y-0.5 ps-5 marker:text-primary">
                    {(list as string[]).map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                ) : (
                  <Empty>{t("seeker.noneAdded")}</Empty>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card id="languages" flat={flat} onEdit={onEdit} needsDetails={needs.has("languages")}>
        <LanguageList languages={p.languages} />
        {p.languages.some((l) => l.attachmentIds.length) && (
          <div className="mt-3 space-y-2 border-t pt-3">
            {p.languages
              .filter((l) => l.attachmentIds.length)
              .map((l) => (
                <div key={l.language} className="text-sm">
                  <span className="text-xs text-muted-foreground">{t("seeker.languageCertificate", { language: l.language })}</span>
                  <Attachments ids={l.attachmentIds} />
                </div>
              ))}
          </div>
        )}
      </Card>

      <Card id="certifications" flat={flat} onEdit={onEdit}>
        <div className="space-y-3">
          {p.certifications.length === 0 && <CertificationList certifications={[]} />}
          {p.certifications.map((c) => (
            <div key={c.id} className={item(!certificationComplete(c))}>
              <CertificationList certifications={[c]} />
              <Attachments ids={c.attachmentIds} />
            </div>
          ))}
        </div>
      </Card>

      <Card id="projects" flat={flat} onEdit={onEdit}>
        {p.projects.length === 0 ? (
          <Empty>{t("seeker.projectsEmpty")}</Empty>
        ) : (
          <ol className="space-y-3 text-sm">
            {p.projects.map((x) => (
              <li key={x.id} className={item(!filled(x.name))}>
                <div className="font-medium">{x.name || <span className="text-muted-foreground italic">{t("seeker.nameNotAdded")}</span>}</div>
                <div className="text-xs text-muted-foreground">
                  {[x.start && formatMonthYear(x.start), x.start && (x.end ? formatMonthYear(x.end) : t("seeker.ongoing"))].filter(Boolean).join(" – ")}
                  {projectDuration(x) && ` · ${projectDuration(x)}`}
                  {x.link && (
                    <a href={x.link} target="_blank" rel="noreferrer" className="ms-2 inline-flex items-center gap-1 text-primary hover:underline">
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

/** The contact details the CV form edits, from the saved user. */
const contactOf = (user: User) => ({
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

/** A CV file read on the CV page: the form opens with it filled in (and what needs a look). */
type Imported = { profile: ReturnType<typeof contactOf>; portfolio: TalentInput; paths: string[] }

function PortfolioForm({
  user,
  talent,
  jumpTo,
  onCancel,
  onSaved,
  imported,
}: {
  user: User
  talent: Talent | null
  jumpTo: EditTarget | null
  onCancel: () => void
  onSaved: () => void
  imported?: Imported | null
}) {
  const t = useT()
  // Opened from a section's Edit button: scroll that section into view
  useEffect(() => {
    if (!jumpTo) return
    // A moment later: when the form opens with the page (a link to ?edit=work), the page is still settling
    // and an immediate scroll gets cut short
    const timer = setTimeout(() => {
      const section = document.getElementById(`edit-${jumpTo === "profession" ? "personal" : jumpTo}`)
      if (!section) return
      section.scrollIntoView({ behavior: "smooth", block: "start" })
      // Put the cursor in the field it's about: the profession, or the section's first field (or its Add button)
      const field =
        jumpTo === "profession"
          ? document.getElementById("edit-profession")
          : section.querySelector<HTMLElement>("input:not([type=file]):not([type=checkbox]), textarea, button[role=combobox], [data-slot=select-trigger], button:not([type=button][aria-label])")
      field?.focus({ preventScroll: true })
    }, 150)
    return () => clearTimeout(timer)
  }, [jumpTo])

  const updateProfile = useStore((s) => s.updateProfile)
  const router = useRouter()
  const saveTalent = useStore((s) => s.saveTalent)
  const [contact, setContact] = useState(() => imported?.profile ?? contactOf(user))
  const [portfolio, setPortfolio] = useState(() => imported?.portfolio ?? (talent ? toPortfolioInput(talent) : EMPTY_PORTFOLIO))
  // Files that were stored when the form opened; the rest were uploaded while editing
  const savedFiles = useRef(new Set(fileIds(talent ?? EMPTY_PORTFOLIO, user.photoId).filter(Boolean)))
  // Follows what's typed: a section turns normal as soon as its required details are in
  // Whole sections turn yellow only when they need an entry they don't have; otherwise the incomplete job,
  // degree, license or field itself does (see portfolio-fields)
  const needs = new Set(sectionsMissingEntries(portfolio))
  // After a CV import: fields the AI wasn't sure about or couldn't find also turn their section yellow
  const [toCheck, setToCheck] = useState<string[]>(imported?.paths ?? [])
  // Only while those details are still empty: once filled in, the section turns normal again (the toast
  // listed everything, including details that were filled in but unclear)
  const stillEmpty = new Set(stillMissing(contact, portfolio))
  const importFlags: Set<string> = sectionsToCheck(toCheck.filter((p) => stillEmpty.has(p)))
  const sectionClass = (id: SectionId) =>
    cn("scroll-mt-20 space-y-4 rounded-xl border p-6", needs.has(id as ListingSection) || importFlags.has(id) ? NEEDS_DETAILS : "bg-card")
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

    // The first time the CV is complete, they go on to see the jobs that match it
    const wasComplete = listingSectionsMissing(user, talent).length === 0
    const profile = updateProfile({ ...contact, company: user.company, bio: user.bio })
    if (!profile.ok) return toast.error(profile.error)
    const saved = saveTalent(portfolio)
    if (!saved.ok) return toast.error(saved.error)
    cleanUpFiles(fileIds(portfolio, contact.photoId))

    // What's still missing for the Pool shows in the status at the top of the profile
    toast.success(t("seeker.cvReady"))
    if (!wasComplete && listingSectionsMissing({ ...user, ...contact }, portfolio).length === 0) return router.push("/jobs?welcome=1")
    onSaved()
  }

  const cancel = () => {
    cleanUpFiles([...savedFiles.current])
    onCancel()
  }

  const heading = (id: SectionId, hint?: string) => (
    <div>
      <h2 className="font-medium">{sectionTitle(t, id)}</h2>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  )

  return (
    <form onSubmit={save} className="space-y-4">
      {/* Import from a CV file, in its own section above the bars */}
      <div className="flex justify-center rounded-xl border bg-card px-5 py-4">
        <CvImportButton
          profile={contact}
          portfolio={portfolio}
          onApply={(next, paths) => {
            setContact(next.profile)
            setPortfolio(next.portfolio)
            setToCheck(paths)
          }}
        />
      </div>
      {/* CV completeness and strength as it's being filled in */}
      <div className="rounded-xl border bg-card px-5 py-4">
        <CvStrengthBar user={contact} talent={portfolio} />
      </div>
      <section id="edit-personal" className={sectionClass("personal")}>
        {heading("personal")}
        <PhotoField
          photoId={contact.photoId}
          name={contact.name}
          color={user.avatarColor}
          onChange={(photoId) => setContact((c) => ({ ...c, photoId }))}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t("seeker.fullName")}>
            <Input className="h-9" value={contact.name} onChange={setField("name")} />
          </Field>
          <Field label={t("seeker.profession")}>
            <Input id="edit-profession" className="h-9" value={contact.title} onChange={setField("title")} placeholder={t("seeker.professionPlaceholder")} />
          </Field>
        </div>
        <PersonalFields value={portfolio} onChange={setPortfolio} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t("seeker.phoneNumber")} missing={!contact.phone}>
            <PhoneInput value={contact.phone} onChange={(phone) => setContact((c) => ({ ...c, phone }))} />
          </Field>
          <Field label={t("seeker.email")} missing={!contact.email}>
            <Input className="h-9" type="email" value={contact.email} onChange={setField("email")} placeholder="name@example.com" />
          </Field>
          <Field label={t("seeker.linkedinOptional")} className="sm:col-span-2">
            <Input className="h-9" value={contact.linkedin} onChange={setField("linkedin")} placeholder="https://linkedin.com/in/…" />
          </Field>
        </div>
        <LocationFields
          value={contact}
          onChange={(patch) => setContact((c) => ({ ...c, ...patch }))}
        />
        <p className="text-xs text-muted-foreground">
          <WithBrand text={t("seeker.contactPrivate")} />
        </p>
      </section>

      <section id="edit-about" className={sectionClass("about")}>
        {heading("about")}
        <Textarea
          className="min-h-24 text-sm"
          value={portfolio.summary}
          onChange={(e) => setPortfolio((p) => ({ ...p, summary: e.target.value }))}
          placeholder={t("seeker.aboutPlaceholder")}
        />
      </section>

      <section id="edit-work" className={sectionClass("work")}>
        {heading("work")}
        <ExperienceFields value={portfolio.experiences} onChange={list("experiences")} />
      </section>

      <section id="edit-education" className={sectionClass("education")}>
        {heading("education")}
        <DegreeFields value={portfolio.degrees} onChange={list("degrees")} />
      </section>

      <section id="edit-skills" className={sectionClass("skills")}>
        {heading("skills")}
        <Field label={t("seeker.hardSkillsLabel")}>
          <TagPicker
            value={portfolio.hardSkills}
            onChange={(hardSkills) => setPortfolio((p) => ({ ...p, hardSkills }))}
            suggestions={HARD_SKILLS}
            placeholder={t("seeker.hardSkillsPlaceholder")}
          />
        </Field>
        <Field label={t("seeker.softSkillsLabel")}>
          <TagPicker
            value={portfolio.softSkills}
            onChange={(softSkills) => setPortfolio((p) => ({ ...p, softSkills }))}
            suggestions={SOFT_SKILLS}
            placeholder={t("seeker.softSkillsPlaceholder")}
          />
        </Field>
      </section>

      <section id="edit-languages" className={sectionClass("languages")}>
        {heading("languages")}
        <LanguageFields value={portfolio.languages} onChange={list("languages")} />
      </section>

      <section id="edit-certifications" className={sectionClass("certifications")}>
        {heading("certifications")}
        <CertificationFields value={portfolio.certifications} onChange={list("certifications")} />
      </section>

      <section id="edit-projects" className={sectionClass("projects")}>
        {heading("projects")}
        <ProjectFields value={portfolio.projects} onChange={list("projects")} />
      </section>


      <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] flex lg:bottom-[calc(1rem+env(safe-area-inset-bottom))] items-center justify-end gap-2 rounded-xl border bg-card/95 p-4 shadow-sm backdrop-blur">
        <Button type="button" variant="ghost" onClick={cancel}>
          {t("common.cancel")}
        </Button>
        <Button type="submit">
          <CircleCheckIcon /> {t("seeker.ready")}
        </Button>
      </div>
    </form>
  )
}

/** The photo at the top of the CV page, with a pencil at its bottom corner that picks a new photo and saves it right away. */
function PhotoWithPencil({ user }: { user: User }) {
  const t = useT()
  const updateProfile = useStore((s) => s.updateProfile)
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const pick = async (file: File) => {
    setBusy(true)
    const res = await saveUpload(file, { imagesOnly: true, maxSide: 600 })
    setBusy(false)
    if (!res.ok) return toast.error(res.error)
    const { name, title, company, email, phone, city, linkedin, bio, country, address } = user
    const saved = updateProfile({ name, title, company, email, phone, city, linkedin, bio, country, address, photoId: res.id })
    if (!saved.ok) return toast.error(saved.error)
    // The old photo isn't needed any more
    if (user.photoId) deleteFile(user.photoId).catch(() => {})
  }

  return (
    <div className="relative shrink-0">
      <ProfilePhoto photoId={user.photoId} name={user.name} color={user.avatarColor} size={72} />
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ""
          if (file) pick(file)
        }}
      />
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        aria-label={user.photoId ? t("form.changePhoto") : t("form.addPhoto")}
        title={user.photoId ? t("form.changePhoto") : t("form.addPhoto")}
        className="absolute -end-0.5 -bottom-0.5 flex size-7 items-center justify-center rounded-full border bg-card text-foreground shadow-sm transition hover:bg-muted"
      >
        {busy ? <LoaderCircleIcon className="size-3.5 animate-spin" /> : <PencilIcon className="size-3.5" />}
      </button>
    </div>
  )
}

const CONTENTS: ListingSection[] = ["personal", "about", "work", "education", "skills", "languages", "certifications", "projects"]
const CONTENTS_ICONS: Record<ListingSection, typeof UserIcon> = {
  personal: IdCardIcon,
  about: FileTextIcon,
  work: BriefcaseIcon,
  education: GraduationCapIcon,
  skills: WrenchIcon,
  languages: LanguagesIcon,
  certifications: AwardIcon,
  projects: FolderKanbanIcon,
}

/**
 * Wide screens: the CV's sections listed beside the page (on the start side), to jump to any of them.
 * The section in view is highlighted. Works on the CV page and in the form (whose sections are edit-<id>).
 */
function Contents({ editing }: { editing: boolean }) {
  const t = useT()
  const [current, setCurrent] = useState<ListingSection>("personal")
  const idOf = (s: ListingSection) => (editing ? `edit-${s}` : `cv-${s}`)

  useEffect(() => {
    const update = () => {
      // The last section whose top has passed just under the header
      let seen: ListingSection = "personal"
      for (const s of CONTENTS) {
        const el = document.getElementById(editing ? `edit-${s}` : `cv-${s}`)
        if (el && el.getBoundingClientRect().top < 140) seen = s
      }
      // At the very bottom the last sections can't reach the top: the last one counts as in view
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
      setCurrent(atBottom ? CONTENTS[CONTENTS.length - 1] : seen)
    }
    update()
    window.addEventListener("scroll", update, { passive: true })
    return () => window.removeEventListener("scroll", update)
  }, [editing])

  return (
    <nav aria-label={t("seeker.contents")} className="fixed top-28 hidden w-48 min-[1200px]:block" style={{ insetInlineStart: "calc(50% - 24rem - 13.5rem)" }}>
      <p className="mb-2 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("seeker.contents")}</p>
      <ul className="space-y-0.5 border-s">
        {CONTENTS.map((s) => {
          const Icon = CONTENTS_ICONS[s]
          return (
          <li key={s}>
            <button
              type="button"
              onClick={() => {
                document.getElementById(idOf(s))?.scrollIntoView({ behavior: "smooth", block: "start" })
                setCurrent(s)
              }}
              className={cn(
                "-ms-px flex w-full items-center gap-2 border-s-2 px-3 py-1 text-start text-sm transition-colors",
                current === s ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {sectionTitle(t, s)}
            </button>
          </li>
          )
        })}
      </ul>
    </nav>
  )
}
