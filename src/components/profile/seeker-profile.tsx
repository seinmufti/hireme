"use client"

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  AwardIcon,
  BookOpenIcon,
  BriefcaseIcon,
  CakeIcon,
  ChevronDownIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  EyeIcon,
  EyeOffIcon,
  FileTextIcon,
  FolderKanbanIcon,
  GlobeIcon,
  GripVerticalIcon,
  GraduationCapIcon,
  HandHeartIcon,
  HeartIcon,
  HomeIcon,
  IdCardIcon,
  LanguagesIcon,
  LinkIcon,
  LockIcon,
  MailIcon,
  MapPinIcon,
  MinusIcon,
  NewspaperIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  RotateCcwIcon,
  Trash2Icon,
  TrophyIcon,
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
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { deleteFile } from "@/lib/files"
import { ageFrom, formatDuration, formatMonthYear, projectDuration, totalMonths } from "@/lib/format"
import { countryName, HARD_SKILLS, SOFT_SKILLS } from "@/lib/options"
import { useCvEditor } from "@/lib/cv-editor"
import { addedExtras, EXTRA_CHOICES, EXTRA_SECTIONS, extraKeyOf, keepFilledExtras, orderSections, type ExtraId, type ExtraKey } from "@/lib/cv-extras"
import { useT } from "@/i18n/provider"
import type { Translate } from "@/i18n/translate"
import { certificationComplete, degreeComplete, filled, jobComplete, listingSectionsMissing, sectionsMissingEntries, portfolioEntryProblem, useStore, type ListingSection } from "@/lib/store"
import type { Talent, TalentInput, User } from "@/lib/types"
import { cn } from "@/lib/utils"
import { WithBrand } from "@/components/brand-name"
import { AttachmentThumb, LocationFields, PhotoConfirmDialog, PhotoField, ProjectFields, TagPicker } from "./cv-fields"
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
/** A part of the CV on the page: one of its own sections, or an added one (extra-courses) */
type CardId = SectionId | ExtraId
/** Where the form can open: a section, or the profession field in the personal section. */
export type EditTarget = CardId | "profession"
const EDIT_TARGETS: EditTarget[] = ["personal", "about", "work", "education", "skills", "languages", "certifications", "projects", "profession"]
/** "?edit=work" or "?edit=extra-courses" (which adds that section to the form) */
const toEditTarget = (value: string | null): EditTarget | null =>
  EDIT_TARGETS.find((x) => x === value) ?? (extraKeyOf(value) ? (value as ExtraId) : null)

// Sections in CV order, as they appear on the profile and in the form
const sectionTitle = (t: Translate, id: CardId) => {
  const extra = extraKeyOf(id)
  return extra ? t(`seeker.extra.${extra}`) : t(`seeker.sections.${id as SectionId}`)
}
/** An added section's answer, in the page's language (marital status, driving license) */
const choiceLabel = (t: Translate, value: string) => t.dynamic(`seeker.choices.${value}`, value)

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
  const startAt = toEditTarget(params.get("edit"))
  const [editing, setEditing] = useState(startEditing)
  // Which form section to scroll to when editing starts from a section's Edit button or a link (?edit=work)
  const [jumpTo, setJumpTo] = useState<EditTarget | null>(startAt)
  // Counts links followed while the form is open, so a second "Add volunteering" adds the section again
  const [jumpSeq, setJumpSeq] = useState(0)
  const [imported, setImported] = useState<Imported | null>(null)
  // A link with ?edit while the CV is already open (e.g. Edit in the Profile tab's Actions) opens the form too
  const editParam = params.get("edit")
  const [seenEditParam, setSeenEditParam] = useState(editParam)
  if (editParam !== seenEditParam) {
    setSeenEditParam(editParam)
    if (editParam !== null) {
      setJumpTo(startAt)
      setJumpSeq((n) => n + 1)
      setEditing(true)
    }
  }
  // Where on screen the section was when its Edit was clicked, so the form opens with that section in the
  // same place (no jumping to the top and scrolling back down)
  const anchor = useRef<Anchor | null>(null)
  const edit = (section: CardId) => {
    const top = document.getElementById(`cv-${section}`)?.getBoundingClientRect().top
    anchor.current = top == null ? null : { formId: `edit-${section}`, top }
    setJumpTo(section)
    setEditing(true)
  }
  // The Edit on the top card (name, title, photo): the form opens with that card where it was, the cursor in the profession
  const editTop = () => {
    const top = document.getElementById("cv-top")?.getBoundingClientRect().top
    anchor.current = top == null ? null : { formId: "edit-top", top }
    setJumpTo("profession")
    setEditing(true)
  }
  const takeAnchor = () => {
    const taken = anchor.current
    anchor.current = null
    return taken
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
  // Phones and tablets: the actions as buttons right under the name (as on LinkedIn's profile), instead
  // of an Actions panel at the end of the page. Wide screens have that panel beside the CV.
  const actions = !editing && (
    <div className="flex gap-2 lg:hidden">
      <Link href="/overview?edit=1" className={buttonVariants({ variant: "outline", className: "h-10 shrink-0 px-4" })}>
        <PencilIcon /> {t("common.edit")}
      </Link>
      <Link href="/profile/cv" className={buttonVariants({ className: "h-10 min-w-0 flex-1" })}>
        <FileTextIcon /> {t("home.previewCv")}
      </Link>
    </div>
  )

  // Import from a CV file lives in the form (see PortfolioForm), not on the CV itself
  if (flat) {
    return (
      <>
        <div className="mx-auto max-w-3xl divide-y rounded-xl border bg-card">
          {/* Name, title and status on the left; CV completeness and strength on the right (stacked on phones) */}
          <div id="cv-top" className="relative grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 sm:items-center">
            {/* Wide screens (phones have the Edit button under the name) */}
            <Button variant="ghost" size="xs" className={cn(EDIT_LINK, "absolute end-3 top-3 hidden lg:inline-flex")} onClick={editTop} aria-label={t("common.edit")}>
              <PencilIcon /> {t("common.edit")}
            </Button>
            <div className="min-w-0 space-y-4">
              {header}
              {actions}
            </div>
            <div className="min-w-0">{strength}</div>
          </div>
          <PortfolioView user={user} talent={talent} onEdit={edit} flat />
        </div>
      </>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {!embedded && <CvContents floating />}
      {/* While editing, the bars are at the top of the form, under Import from your CV */}
      {!editing && header}
      {actions}
      {!editing && <div className="rounded-xl border bg-card px-5 py-4">{strength}</div>}

      {editing ? (
        <PortfolioForm
          user={user}
          talent={talent}
          jumpTo={jumpTo}
          jumpSeq={jumpSeq}
          takeAnchor={takeAnchor}
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
  id: CardId
  onEdit: (section: CardId) => void
  needsDetails?: boolean
  /** Inside the one CV card: no border of its own (the card draws lines between sections) */
  flat?: boolean
  note?: React.ReactNode
  children: React.ReactNode
}) {
  const t = useT()
  const title = sectionTitle(t, id)
  const hiddenOnCv = useStore((s) => !!s.talents.find((x) => x.userId === s.currentUserId)?.hiddenSections?.includes(id))
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
          {hiddenOnCv && (
            <span className="ms-2 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-normal">
              <EyeOffIcon className="size-3" /> {t("seeker.hiddenOnCv")}
            </span>
          )}
        </h2>
        <Button variant="ghost" size="sm" className={EDIT_LINK} onClick={() => onEdit(id)} aria-label={t("seeker.editSection", { section: title })}>
          <PencilIcon /> {t("common.edit")}
        </Button>
      </div>
      <div className={cn(hiddenOnCv && "opacity-50")}>{children}</div>
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

function PortfolioView({ user, talent, onEdit, flat = false }: { user: User; talent: Talent | null; onEdit: (section: CardId) => void; flat?: boolean }) {
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

  // Each part of the CV, shown in the order the job seeker chose
  const cards: Record<string, React.ReactNode> = {
    personal: (
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
    ),
    about: (
      <Card id="about" flat={flat} onEdit={onEdit}>
        {p.summary ? <p className="text-sm whitespace-pre-line">{p.summary}</p> : <Empty>{t("seeker.aboutEmpty")}</Empty>}
      </Card>
    ),
    work: (
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
    ),
    education: (
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
    ),
    skills: (
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
    ),
    languages: (
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
    ),
    certifications: (
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
    ),
    projects: (
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
    ),
  }
  for (const key of addedExtras(p, true)) {
    cards[`extra-${key}`] = (
      <Card id={`extra-${key}`} flat={flat} onEdit={onEdit}>
        <ul className="flex flex-wrap gap-1.5 text-sm">
          {p.extraSections?.[key]?.map((x) => (
            <li key={x} className="rounded-full bg-muted px-2.5 py-0.5">
              {EXTRA_CHOICES[key] ? choiceLabel(t, x) : x}
            </li>
          ))}
        </ul>
      </Card>
    )
  }

  return (
    <div className={flat ? "divide-y" : "space-y-4"}>
      {orderSections(Object.keys(cards), p.sectionOrder).map((id) => (
        <Fragment key={id}>{cards[id]}</Fragment>
      ))}
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
/** The CV's Edit buttons: blue and underlined, like links (the same blue as the Actions panel) */
const EDIT_LINK = "text-blue-700 underline underline-offset-4 hover:bg-blue-50 hover:text-blue-800"

/** Opening the form: which part of it (by id) goes where the clicked part was on screen */
type Anchor = { formId: string; top: number }

type Imported = { profile: ReturnType<typeof contactOf>; portfolio: TalentInput; paths: string[] }

function PortfolioForm({
  user,
  talent,
  jumpTo,
  jumpSeq = 0,
  takeAnchor,
  onCancel,
  onSaved,
  imported,
}: {
  user: User
  talent: Talent | null
  jumpTo: EditTarget | null
  /** Changes with every link followed while the form is open (see SeekerProfile) */
  jumpSeq?: number
  /** Where the clicked part was on screen (once), to open its form in the same place */
  takeAnchor?: () => Anchor | null
  onCancel: () => void
  onSaved: () => void
  imported?: Imported | null
}) {
  const t = useT()
  // Put the cursor in the field it's about: the profession, or the section's first field (or its Add button)
  const focusIn = (section: HTMLElement) => {
    const field =
      jumpTo === "profession"
        ? document.getElementById("edit-profession")
        : section.querySelector<HTMLElement>("input:not([type=file]):not([type=checkbox]), textarea, button[role=combobox], [data-slot=select-trigger], button:not([type=button][aria-label])")
    field?.focus({ preventScroll: true })
  }
  // Opened from a section's Edit button: that section's form where the section was, before the page is drawn
  const anchored = useRef(false)
  useLayoutEffect(() => {
    const taken = jumpTo ? takeAnchor?.() : null
    if (!jumpTo || !taken) return
    const target = document.getElementById(taken.formId)
    const section = document.getElementById(`edit-${jumpTo === "profession" ? "personal" : jumpTo}`)
    if (!target || !section) return
    anchored.current = true
    window.scrollBy({ top: target.getBoundingClientRect().top - taken.top, behavior: "instant" })
    focusIn(section)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jumpTo, jumpSeq])
  // Opened by a link (?edit=work): scroll that section into view once the page has settled
  useEffect(() => {
    if (!jumpTo || anchored.current) return
    // A moment later: when the form opens with the page (a link to ?edit=work), the page is still settling
    // and an immediate scroll gets cut short
    const timer = setTimeout(() => {
      const section = document.getElementById(`edit-${jumpTo === "profession" ? "personal" : jumpTo}`)
      if (!section) return
      section.scrollIntoView({ behavior: "smooth", block: "start" })
      focusIn(section)
    }, 150)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jumpTo, jumpSeq])

  const updateProfile = useStore((s) => s.updateProfile)
  const saveTalent = useStore((s) => s.saveTalent)
  const [contact, setContact] = useState(() => imported?.profile ?? contactOf(user))
  const [portfolio, setPortfolio] = useState(() => imported?.portfolio ?? (talent ? toPortfolioInput(talent) : EMPTY_PORTFOLIO))
  // Opened to add a section ("Add volunteering" under Categories): it's added to the form, empty, to fill in
  const [seenJump, setSeenJump] = useState<number | null>(null)
  if (seenJump !== jumpSeq) {
    setSeenJump(jumpSeq)
    const added = extraKeyOf(jumpTo)
    if (added && !portfolio.extraSections?.[added]) setPortfolio((p) => ({ ...p, extraSections: { ...p.extraSections, [added]: [] } }))
  }
  const setExtra = (key: ExtraKey, list: string[] | null) =>
    setPortfolio((p) => {
      const extraSections = { ...p.extraSections }
      if (list) extraSections[key] = list
      else delete extraSections[key]
      return { ...p, extraSections }
    })
  // The Categories list beside the form shows the sections added here, can remove them, and puts the
  // sections in order (saved with the form)
  const formExtras = addedExtras(portfolio).join()
  const formOrder = (portfolio.sectionOrder ?? []).join()
  useEffect(() => {
    useCvEditor.setState({
      extras: formExtras ? (formExtras.split(",") as ExtraKey[]) : [],
      order: formOrder ? formOrder.split(",") : [],
      setOrder: (order) => setPortfolio((p) => ({ ...p, sectionOrder: order ?? [] })),
      remove: (key) =>
        setPortfolio((p) => {
          const extraSections = { ...p.extraSections }
          delete extraSections[key]
          return { ...p, extraSections }
        }),
    })
  }, [formExtras, formOrder])
  useEffect(() => () => useCvEditor.setState({ extras: null }), [])
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
    // An added section has to have something in it (or be removed)
    const emptyExtra = addedExtras(portfolio).find((key) => !portfolio.extraSections?.[key]?.length)
    if (emptyExtra) {
      document.getElementById(`edit-extra-${emptyExtra}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
      return toast.error(t("seeker.extraEmpty", { section: sectionTitle(t, `extra-${emptyExtra}`) }))
    }

    const profile = updateProfile({ ...contact, company: user.company, bio: user.bio })
    if (!profile.ok) return toast.error(profile.error)
    const saved = saveTalent({ ...portfolio, extraSections: keepFilledExtras(portfolio.extraSections) })
    if (!saved.ok) return toast.error(saved.error)
    cleanUpFiles(fileIds(portfolio, contact.photoId))

    // What's still missing for the Pool shows in the status at the top of the profile
    toast.success(t("seeker.cvReady"))
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

  // The form's sections, in the order the job seeker chose for their CV
  const formSections: Record<string, React.ReactNode> = {
    personal: (
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
    ),
    about: (
      <section id="edit-about" className={sectionClass("about")}>
        {heading("about")}
        <Textarea
          className="min-h-24 text-sm"
          value={portfolio.summary}
          onChange={(e) => setPortfolio((p) => ({ ...p, summary: e.target.value }))}
          placeholder={t("seeker.aboutPlaceholder")}
        />
      </section>
    ),
    work: (
      <section id="edit-work" className={sectionClass("work")}>
        {heading("work")}
        <ExperienceFields value={portfolio.experiences} onChange={list("experiences")} />
      </section>
    ),
    education: (
      <section id="edit-education" className={sectionClass("education")}>
        {heading("education")}
        <DegreeFields value={portfolio.degrees} onChange={list("degrees")} />
      </section>
    ),
    skills: (
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
    ),
    languages: (
      <section id="edit-languages" className={sectionClass("languages")}>
        {heading("languages")}
        <LanguageFields value={portfolio.languages} onChange={list("languages")} />
      </section>
    ),
    certifications: (
      <section id="edit-certifications" className={sectionClass("certifications")}>
        {heading("certifications")}
        <CertificationFields value={portfolio.certifications} onChange={list("certifications")} />
      </section>
    ),
    projects: (
      <section id="edit-projects" className={sectionClass("projects")}>
        {heading("projects")}
        <ProjectFields value={portfolio.projects} onChange={list("projects")} />
      </section>
    ),
  }
  for (const key of addedExtras(portfolio)) {
        const value = portfolio.extraSections?.[key] ?? []
        const choices = EXTRA_CHOICES[key]
    formSections[`extra-${key}`] = (
          <section id={`edit-extra-${key}`} className={cn("scroll-mt-20 space-y-4 rounded-xl border p-6", value.length ? "bg-card" : NEEDS_DETAILS)}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-medium">{sectionTitle(t, `extra-${key}`)}</h2>
                {/* Yellow until something is in it: it can't be saved empty */}
                {!value.length && <p className="text-sm text-amber-900">{t("seeker.extraFillIn")}</p>}
              </div>
              <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setExtra(key, null)}>
                <Trash2Icon /> {t("seeker.removeSection")}
              </Button>
            </div>
            {choices ? (
              // Pick one of the answers (marital status); picking it again clears it
              <div className="flex flex-wrap gap-2">
                {choices.map((c) => {
                  const on = value.includes(c)
                  return (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setExtra(key, on ? [] : [c])}
                      className={cn(
                        "rounded-full border px-3 py-1 text-sm transition-colors",
                        on ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
                      )}
                    >
                      {choiceLabel(t, c)}
                    </button>
                  )
                })}
              </div>
            ) : (
              <TagPicker
                value={value}
                onChange={(next) => setExtra(key, next)}
                suggestions={[]}
                placeholder={t("seeker.extraPlaceholder")}
              />
            )}
          </section>
    )
  }

  return (
    <form onSubmit={save} className="space-y-4">
      {/* At the top of the form: import from a CV file, then CV completeness and strength as it's being filled in */}
      <div id="edit-top" className="space-y-5 rounded-xl border bg-card p-6">
        <div className="flex justify-center">
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
        <CvStrengthBar user={contact} talent={portfolio} />
      </div>
      {orderSections(Object.keys(formSections), portfolio.sectionOrder).map((id) => (
        <Fragment key={id}>{formSections[id]}</Fragment>
      ))}


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
  // The picked photo, waiting for Save in the compare dialog
  const [picked, setPicked] = useState<File | null>(null)

  const use = (photoId: string) => {
    const { name, title, company, email, phone, city, linkedin, bio, country, address } = user
    const saved = updateProfile({ name, title, company, email, phone, city, linkedin, bio, country, address, photoId })
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
          if (file) setPicked(file)
        }}
      />
      <PhotoConfirmDialog file={picked} current={{ photoId: user.photoId, name: user.name, color: user.avatarColor }} onSaved={use} onClose={() => setPicked(null)} />
      <button
        type="button"
        onClick={() => input.current?.click()}
        aria-label={user.photoId ? t("form.changePhoto") : t("form.addPhoto")}
        title={user.photoId ? t("form.changePhoto") : t("form.addPhoto")}
        className="absolute -end-0.5 -bottom-0.5 flex size-7 items-center justify-center rounded-full border bg-card text-foreground shadow-sm transition hover:bg-muted"
      >
        <PencilIcon className="size-3.5" />
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
const EXTRA_ICONS: Record<ExtraKey, typeof UserIcon> = {
  maritalStatus: HeartIcon,
  volunteering: HandHeartIcon,
  awards: TrophyIcon,
  courses: BookOpenIcon,
  publications: NewspaperIcon,
}

/**
 * Wide screens: the CV's sections listed beside the page (on the start side), to jump to any of them.
 * The section in view is highlighted. Works on the CV page and in the form (whose sections are edit-<id>).
 */
/**
 * The CV's sections, to jump to any of them; the one in view is marked. Beside the page on its own
 * (`floating`), or as a card in a sidebar (the Profile tab, under Overall).
 */
export function CvContents({ floating }: { floating?: boolean }) {
  const t = useT()
  const router = useRouter()
  const pathname = usePathname()
  const [current, setCurrent] = useState<CardId>("personal")
  const [moreOpen, setMoreOpen] = useState(false)
  const talent = useStore((s) => s.talents.find((x) => x.userId === s.currentUserId))
  const hidden = talent?.hiddenSections ?? []
  const toggle = useStore((s) => s.toggleCvSection)
  // The CV's sections, then the ones added to it (in the sidebar)
  // While editing: the sections added in the form (they can be removed here too)
  const editing = useCvEditor((s) => s.extras)
  const removeExtra = useCvEditor((s) => s.remove)
  // Sections are put in order only while editing (dragged here, saved with the form)
  const editorOrder = useCvEditor((s) => s.order)
  const setOrder = useCvEditor((s) => s.setOrder)
  const order = editing ? editorOrder : talent?.sectionOrder
  const extras = floating ? [] : (editing ?? addedExtras(talent ?? {}, true))
  const canAdd = floating ? [] : EXTRA_SECTIONS.filter((key) => !extras.includes(key))
  // In the job seeker's order; while dragging, where the row is now
  const ordered = orderSections<CardId>([...CONTENTS, ...extras.map((key) => `extra-${key}` as const)], order)
  const [drag, setDrag] = useState<{ id: CardId; list: CardId[] } | null>(null)
  const sections = drag?.list ?? ordered
  const sectionsKey = ordered.join()
  const reordered = !!editing && !!order?.length
  // The section's form while editing, otherwise its part of the CV
  const sectionEl = (s: CardId) => document.getElementById(`edit-${s}`) ?? document.getElementById(`cv-${s}`)

  useEffect(() => {
    const ids = sectionsKey.split(",") as CardId[]
    const update = () => {
      // The last section (in page order) whose top has passed just under the header
      let seen: CardId = ids[0]
      let seenTop = -Infinity
      for (const s of ids) {
        const top = sectionEl(s)?.getBoundingClientRect().top
        if (top != null && top < 140 && top > seenTop) {
          seen = s
          seenTop = top
        }
      }
      // At the very bottom the last sections can't reach the top: the last one counts as in view
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
      setCurrent(atBottom ? ids[ids.length - 1] : seen)
    }
    update()
    window.addEventListener("scroll", update, { passive: true })
    return () => window.removeEventListener("scroll", update)
  }, [sectionsKey])

  // Dragging a row up or down: it follows the pointer and the
  // order is saved when it's let go. A press that doesn't move is a click (jump to the section).
  const list = useRef<HTMLUListElement>(null)
  const pressed = useRef<{ id: CardId; y: number; moved: boolean; list?: CardId[] } | null>(null)
  const startPress = (id: CardId, e: React.PointerEvent) => {
    if (floating || !editing || e.button !== 0) return
    pressed.current = { id, y: e.clientY, moved: false }
    const move = (ev: PointerEvent) => {
      const press = pressed.current
      if (!press || !list.current) return
      if (!press.moved && Math.abs(ev.clientY - press.y) < 5) return
      press.moved = true
      // Where it goes: after every other row whose middle is above the pointer
      const rows = [...list.current.querySelectorAll<HTMLElement>("[data-section]")].filter(
        (row) => row.dataset.section !== press.id
      )
      const at = rows.filter((row) => {
        const box = row.getBoundingClientRect()
        return ev.clientY > box.top + box.height / 2
      }).length
      const rest: CardId[] = ordered.filter((x) => x !== press.id)
      rest.splice(at, 0, press.id)
      press.list = rest
      setDrag({ id: press.id, list: press.list })
    }
    const up = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", up)
      const moved = pressed.current?.list
      if (moved) setOrder(moved)
      setDrag(null)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", up)
  }
  // With the keyboard: Alt + arrow up/down moves the focused section
  const moveBy = (id: CardId, step: number) => {
    const rest: CardId[] = [...ordered]
    const from = rest.indexOf(id)
    const to = from + step
    if (from < 0 || to < 0 || to >= rest.length) return
    rest.splice(from, 1)
    rest.splice(to, 0, id)
    setOrder(rest)
  }

  return (
    <nav
      aria-label={t("seeker.contents")}
      className={floating ? "fixed top-28 hidden w-48 min-[1200px]:block" : "rounded-xl border bg-card py-4 pe-3 ps-2"}
      style={floating ? { insetInlineStart: "calc(50% - 24rem - 13.5rem)" } : undefined}
    >
      <div className="mb-2 flex items-center justify-between gap-2 px-3">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("seeker.contents")}</p>
        {/* Back to the usual order */}
        {!floating && reordered && (
          <button
            type="button"
            onClick={() => setOrder(null)}
            title={t("seeker.resetOrderHint")}
            className="-me-1.5 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-blue-700 hover:bg-blue-50"
          >
            <RotateCcwIcon className="size-3" />
            <span className="underline underline-offset-4">{t("seeker.resetOrder")}</span>
          </button>
        )}
      </div>
      <ul ref={list} className={cn("space-y-0.5 border-s", drag && "cursor-grabbing select-none")}>
        {sections.map((s) => {
          const extra = extraKeyOf(s)
          const Icon = extra ? EXTRA_ICONS[extra] : CONTENTS_ICONS[s as SectionId]
          const isHidden = hidden.includes(s)
          const movable = !floating && !!editing
          return (
          <li key={s} data-section={s} className={cn("group/row relative flex items-center rounded-md", drag?.id === s && "bg-muted shadow-sm")}>
            <button
              type="button"
              onPointerDown={(e) => startPress(s, e)}
              onClick={() => {
                // The end of a drag isn't a click
                if (pressed.current?.moved) return void (pressed.current = null)
                sectionEl(s)?.scrollIntoView({ behavior: "smooth", block: "start" })
                setCurrent(s)
              }}
              onKeyDown={(e) => {
                if (!movable || !e.altKey || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return
                e.preventDefault()
                moveBy(s, e.key === "ArrowUp" ? -1 : 1)
              }}
              title={movable ? t("seeker.dragToMove") : undefined}
              className={cn(
                "-ms-px flex min-w-0 flex-1 items-center gap-2 border-s-2 px-3 py-1 text-start text-sm transition-colors",
                movable && (drag ? "cursor-grabbing" : "cursor-grab"),
                current === s ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                isHidden && "line-through decoration-muted-foreground/60"
              )}
            >
              {/* While editing, an added section has its remove button here instead (see below). Otherwise the
                  icon turns into a grip on hover: the row can be dragged up or down */}
              {!floating && editing && extra ? (
                <span className="size-4 shrink-0" />
              ) : movable ? (
                <span className="relative size-4 shrink-0">
                  <Icon className={cn("size-4 transition-opacity group-hover/row:opacity-0", drag?.id === s && "opacity-0")} />
                  <GripVerticalIcon className={cn("absolute inset-0 size-4 opacity-0 transition-opacity group-hover/row:opacity-100", drag?.id === s && "opacity-100")} />
                </span>
              ) : (
                <Icon className="size-4 shrink-0" />
              )}
              {sectionTitle(t, s)}
            </button>
            {/* While editing: take an added section off the CV, on the start side like the + of the ones to add */}
            {!floating && editing && extra && (
              <button
                type="button"
                onClick={() => removeExtra(extra)}
                aria-label={t("seeker.removeSectionNamed", { section: sectionTitle(t, s) })}
                title={t("seeker.removeSectionNamed", { section: sectionTitle(t, s) })}
                className="absolute start-[9px] top-1/2 -translate-y-1/2 rounded-md p-1 text-red-600 transition-colors hover:bg-red-50"
              >
                <MinusIcon className="size-4" />
              </button>
            )}
            {/* In the sidebar only: show or hide the section on the CV (personal details are the CV's header, always shown) */}
            {!floating && s !== "personal" && (
              <button
                type="button"
                onClick={() => toggle(s)}
                aria-pressed={isHidden}
                aria-label={t(isHidden ? "seeker.showOnCv" : "seeker.hideOnCv", { section: sectionTitle(t, s) })}
                title={t(isHidden ? "seeker.showOnCv" : "seeker.hideOnCv", { section: sectionTitle(t, s) })}
                className={cn("shrink-0 rounded-md p-1 transition-colors hover:bg-muted", isHidden ? "text-muted-foreground" : "text-blue-700")}
              >
                {isHidden ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            )}
          </li>
          )
        })}
      </ul>
      {/* More sections to add to the CV: the form opens with the new one at the end */}
      {canAdd.length > 0 && (
        <div className="mt-3 border-t ps-1 pt-3">
          <button
            type="button"
            onClick={() => setMoreOpen((o) => !o)}
            aria-expanded={moreOpen}
            className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-sm font-medium hover:bg-muted"
          >
            {t("seeker.additionalSections")}
            <ChevronDownIcon className={cn("size-4 text-muted-foreground transition-transform", moreOpen && "rotate-180")} />
          </button>
          {moreOpen && (
            <ul className="mt-1 space-y-0.5">
              {canAdd.map((key) => (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => router.push(`${pathname}?edit=extra-${key}`, { scroll: false })}
                    aria-label={t("seeker.addSection", { section: sectionTitle(t, `extra-${key}`) })}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-start text-sm text-blue-700 hover:bg-blue-50"
                  >
                    <PlusIcon className="size-4 shrink-0" />
                    <span className="underline underline-offset-4">{sectionTitle(t, `extra-${key}`)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </nav>
  )
}
