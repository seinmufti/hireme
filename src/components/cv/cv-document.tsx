"use client"

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react"
import { CakeIcon, LinkIcon, MailIcon, MapPinIcon, PaperclipIcon, PhoneIcon } from "lucide-react"
import { Logo } from "@/components/logo"
import { useStoredFile } from "@/lib/files"
import { addedExtras, EXTRA_CV_TITLES, orderSections } from "@/lib/cv-extras"
import { countryName } from "@/lib/options"
import type { TalentInput, User } from "@/lib/types"
import { firstName, jobPlace } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Flag, ProfilePhoto } from "./photo"
import { BrandName } from "@/components/brand-name"

/**
 * Who the CV is about. Employers get a version without contact details, address and references
 * (pass `forEmployer`); the job seeker's own preview and download have everything.
 */
export type CvPerson = Pick<User, "name" | "title" | "photoId" | "avatarColor" | "country" | "city"> &
  Partial<Pick<User, "email" | "phone" | "linkedin" | "address">>

/** What the CV shows of the portfolio. Employers get the age, never the exact date of birth. */
export type CvTalent = Omit<TalentInput, "dateOfBirth" | "published" | "workPreference"> & { dateOfBirth?: string }

// A calm, classic CV: near-black text, one muted navy accent, plenty of white space
const ACCENT = "#2F5D8A"
const INK = "#1F2328"
const MUTED = "#5B6470"

// A4 in millimetres; the page's content box is what's left inside the margins
const PAGE_W = 210
const PAGE_H = 297
const MARGIN_X = 18
const MARGIN_TOP = 18
const MARGIN_BOTTOM = 26 // room for the HireMe logo
const CONTENT_H_MM = PAGE_H - MARGIN_TOP - MARGIN_BOTTOM
const MM = 96 / 25.4 // CSS pixels per millimetre

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
/** "2022-03" -> "Mar 2022" */
const monthYear = (value: string) => {
  const [y, m] = (value ?? "").split("-").map(Number)
  return y && m >= 1 && m <= 12 ? `${MONTHS[m - 1]} ${y}` : y ? String(y) : ""
}
const range = (from: string, to: string) => [from, to].filter(Boolean).join(" – ")

const LEVEL_WORDS: Record<string, string> = {
  Native: "Native",
  C2: "Proficient",
  C1: "Very good",
  B2: "Good",
  B1: "Intermediate",
  A2: "Basic",
  A1: "Beginner",
}

const lines = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean)

/** A bullet's text, with **words** in bold (job seekers can stress results, e.g. "**increased sales by 43%**"). */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        /^\*\*[^*]+\*\*$/.test(part) ? <strong key={i} className="font-bold">{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>
      )}
    </>
  )
}

/**
 * The CV as A4 pages, in a classic one-column layout: dates and labels in a narrow column on the left,
 * the details on the right. The content is cut into blocks (the header, each job, each degree, ...),
 * measured, and placed page by page, so a job or degree never splits across pages.
 * `ref` gets the element holding the pages (what Download PDF prints).
 */
export function CvDocument({
  person,
  talent: t,
  age,
  forEmployer = false,
  premium,
  showAttachments = false,
  className,
  ref,
}: {
  person: CvPerson
  talent: CvTalent
  age: number | null
  forEmployer?: boolean
  premium: boolean
  showAttachments?: boolean
  className?: string
  ref?: React.Ref<HTMLDivElement>
}) {
  const blocks = buildBlocks(person, t, age, forEmployer, showAttachments)
  const measure = useRef<HTMLDivElement>(null)
  // Block indexes on each page; until measured, everything is on one page
  const [pages, setPages] = useState<number[][]>([blocks.map((_, i) => i)])

  const layout = () => {
    const el = measure.current
    if (!el) return
    const available = CONTENT_H_MM * MM
    const next: number[][] = [[]]
    let used = 0
    for (const [i, child] of [...el.children].entries()) {
      const h = (child as HTMLElement).offsetHeight
      if (used + h > available && next[next.length - 1].length) {
        next.push([])
        used = 0
      }
      next[next.length - 1].push(i)
      used += h
    }
    setPages((current) => (JSON.stringify(current) === JSON.stringify(next) ? current : next))
  }

  // Narrower than an A4 page (phones): the pages are shown smaller to fit; printing is unaffected
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const fit = () => setScale(Math.min(1, el.clientWidth / (PAGE_W * MM)))
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(el)
    return () => observer.disconnect()
  })

  // Re-measure after every render (the content may have changed), when fonts arrive and when images load
  useLayoutEffect(layout)
  useEffect(() => {
    document.fonts?.ready.then(layout)
    const observer = new ResizeObserver(layout)
    if (measure.current) observer.observe(measure.current)
    return () => observer.disconnect()
  })

  return (
    // The CV is always in English, so it stays left to right even when the app is in Arabic or Kurdish
    // Clipped sideways: the hidden measuring copy below is A4-wide and mustn't widen a phone's page
    <div ref={box} dir="ltr" className={cn("relative overflow-x-clip", className)}>
      <div style={scale < 1 ? { zoom: scale } : undefined}>
      <div ref={ref} className="cv-pages flex flex-col items-center gap-[8mm]">
        {pages.map((indexes, p) => (
          <Page key={p} premium={premium}>
            {indexes.map((i) => (
              <Fragment key={blocks[i]?.key ?? i}>{blocks[i]?.node}</Fragment>
            ))}
          </Page>
        ))}
      </div>
      </div>
      {/* The same blocks, invisible, at the page's content width: their heights decide the pages */}
      <div
        ref={measure}
        aria-hidden
        inert
        className={cn(CV_TEXT, "pointer-events-none absolute top-0 left-0 -z-10 opacity-0")}
        style={{ width: `${PAGE_W - 2 * MARGIN_X}mm`, color: INK }}
      >
        {blocks.map((b) => (
          <div key={b.key}>{b.node}</div>
        ))}
      </div>
    </div>
  )
}

const CV_TEXT = "font-[family-name:var(--font-cv)] text-[9.5pt] leading-[1.5]"

/** One A4 page: the HireMe logo centred at the bottom and, on free CVs, the watermark. */
function Page({ premium, children }: { premium: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(CV_TEXT, "cv-page relative overflow-hidden bg-white shadow-lg ring-1 ring-black/5 [print-color-adjust:exact]")}
      style={{
        width: `${PAGE_W}mm`,
        height: `${PAGE_H}mm`,
        padding: `${MARGIN_TOP}mm ${MARGIN_X}mm ${MARGIN_BOTTOM}mm`,
        color: INK,
      }}
    >
      {children}

      {/* Always at the bottom of every page, also on premium CVs */}
      <div className="absolute bottom-[5mm] left-1/2 flex -translate-x-1/2 items-center gap-2.5 text-[14pt] font-semibold" style={{ color: MUTED }}>
        <Logo size={42} />
        <BrandName />
      </div>

      {!premium && (
        // Free CVs: "HireMe" repeated across the whole page, like a stock photo; rows are staggered
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden select-none">
          <div className="absolute -inset-[40%] flex -rotate-30 flex-col justify-center gap-[14mm]">
            {Array.from({ length: 22 }, (_, row) => (
              <div key={row} className={cn("flex gap-[16mm] whitespace-nowrap", row % 2 && "translate-x-[22mm]")}>
                {Array.from({ length: 12 }, (_, i) => (
                  <BrandName key={i} className="text-[20pt] font-black tracking-wider opacity-[0.13]" />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/** Small spaced capitals in the accent colour, with a hairline running to the right edge. */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-[3mm] flex items-center gap-[3mm] pt-[6mm] text-[9pt] font-bold tracking-[0.18em] uppercase" style={{ color: ACCENT }}>
      {children}
      <span className="h-px flex-1" style={{ background: "#D5DAE0" }} />
    </h2>
  )
}

/** A row with a narrow left column (dates, labels) and the details on the right. */
function Row({ aside, children, className }: { aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-[34mm_1fr] gap-x-[5mm]", className)}>
      <div className="pt-[0.3mm] text-[8.5pt] leading-[1.6]" style={{ color: MUTED }}>
        {aside}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

type Block = { key: string; node: React.ReactNode }

/** The CV cut into blocks that each stay on one page. A section's title travels with its first entry. */
function buildBlocks(person: CvPerson, t: CvTalent, age: number | null, forEmployer: boolean, showAttachments: boolean): Block[] {
  const blocks: Block[] = [{ key: "header", node: <Header person={person} t={t} age={age} forEmployer={forEmployer} /> }]

  // Sections the job seeker hid from their CV (the CV calls "about" its summary)
  const hidden = new Set((t.hiddenSections ?? []).map((s) => (s === "about" ? "summary" : s)))
  // Each section's blocks, put in the job seeker's order at the end
  const sections = new Map<string, Block[]>()
  const section = (key: string, title: string, items: { key: string; node: React.ReactNode }[]) => {
    if (hidden.has(key)) return
    const own: Block[] = []
    sections.set(key === "summary" ? "about" : key, own)
    items.forEach((item, i) =>
      own.push({
        key: `${key}-${item.key}`,
        node: i === 0 ? (
          <>
            <SectionTitle>{title}</SectionTitle>
            {item.node}
          </>
        ) : (
          item.node
        ),
      })
    )
  }

  if (t.summary) {
    section("summary", "Summary", [{ key: "text", node: <p className="pb-[1mm] text-justify">{t.summary}</p> }])
  }

  const jobs = t.experiences.filter((e) => e.title || e.employer)
  section(
    "work",
    "Experience",
    jobs.map((e) => ({
      key: e.id,
      node: (
        <Row aside={range(monthYear(e.start), e.current ? "Present" : monthYear(e.end))} className="pb-[4mm]">
          <p className="text-[10pt] font-bold">{e.title}</p>
          <p className="italic" style={{ color: MUTED }}>
            {[e.employer, jobPlace(e), e.contractType].filter(Boolean).join(" · ")}
          </p>
          {e.description && (
            <ul className="mt-[1.5mm] list-disc space-y-[0.6mm] ps-[4.5mm] marker:text-[7pt] marker:text-[#2F5D8A]">
              {lines(e.description).map((b, i) => (
                <li key={i}>
                  <Rich text={b} />
                </li>
              ))}
            </ul>
          )}
          {e.reference && (
            <p className="mt-[1mm] text-[8.5pt] italic" style={{ color: MUTED }}>
              Reference available on request
            </p>
          )}
        </Row>
      ),
    }))
  )

  const degrees = t.degrees.filter((d) => d.name || d.institution || d.level)
  section(
    "education",
    "Education",
    degrees.map((d) => ({
      key: d.id,
      node: (
        <Row aside={range(d.startYear, d.endYear && (d.status === "Studying" ? `exp. ${d.endYear}` : d.endYear))} className="pb-[3mm]">
          <p className="text-[10pt] font-bold">{d.name || d.level}</p>
          <p className="italic" style={{ color: MUTED }}>
            {[d.institution, d.field && d.field !== d.name ? d.field : ""].filter(Boolean).join(" · ")}
          </p>
          {showAttachments && <Attachments ids={d.attachmentIds} />}
        </Row>
      ),
    }))
  )

  const skillRows = [
    { label: "Hard skills", list: t.hardSkills },
    { label: "Soft skills", list: t.softSkills },
  ].filter((g) => g.list.length)
  section(
    "skills",
    "Core competencies",
    skillRows.map((g) => ({
      key: g.label,
      node: (
        <Row aside={g.label} className="pb-[2mm]">
          <p>{g.list.join("  ·  ")}</p>
        </Row>
      ),
    }))
  )

  const languages = t.languages.filter((l) => l.language)
  if (languages.length) {
    section("languages", "Languages", [
      {
        key: "all",
        node: (
          <div className="grid grid-cols-3 gap-x-[5mm] gap-y-[1.5mm] pb-[1mm]">
            {languages.map((l) => (
              <p key={l.language}>
                <span className="font-bold">{l.language}</span>
                <span style={{ color: MUTED }}> — {LEVEL_WORDS[l.speaking] ?? l.speaking}</span>
                {showAttachments && <Attachments ids={l.attachmentIds} />}
              </p>
            ))}
          </div>
        ),
      },
    ])
  }

  const certifications = t.certifications.filter((c) => c.title)
  section(
    "certifications",
    "Licenses & certifications",
    certifications.map((c) => ({
      key: c.id,
      node: (
        <Row aside={monthYear(c.issued)} className="pb-[2mm]">
          <p>
            <span className="font-bold">{c.title}</span>
            {c.institution && <span className="italic" style={{ color: MUTED }}> · {c.institution}</span>}
          </p>
          {showAttachments && <Attachments ids={c.attachmentIds} />}
        </Row>
      ),
    }))
  )

  const projects = t.projects.filter((p) => p.name)
  section(
    "projects",
    "Projects & activities",
    projects.map((p) => ({
      key: p.id,
      node: (
        <Row aside={p.start || p.end ? range(monthYear(p.start), p.end ? monthYear(p.end) : "Present") : ""} className="pb-[3mm]">
          <p className="font-bold">{p.name}</p>
          {p.link && (
            <p className="text-[8.5pt]" style={{ color: ACCENT }}>
              {p.link.replace(/^https?:\/\/(www\.)?/, "")}
            </p>
          )}
          {p.description && <p>{p.description}</p>}
        </Row>
      ),
    }))
  )

  // The optional sections they added (marital status, volunteering...), each on one line
  for (const key of addedExtras(t, true)) {
    section(`extra-${key}`, EXTRA_CV_TITLES[key], [{ key: "list", node: <p className="pb-[3mm]">{t.extraSections?.[key]?.join(" · ")}</p> }])
  }

  for (const id of orderSections([...sections.keys()], t.sectionOrder)) blocks.push(...sections.get(id)!)
  return blocks
}

/** Name, profession, one line of contact details, the photo on the right, and a hairline under it all. */
function Header({ person, t, age, forEmployer }: { person: CvPerson; t: CvTalent; age: number | null; forEmployer: boolean }) {
  const place = [!forEmployer && person.address, person.city, countryName(person.country)].filter(Boolean).join(", ")
  const born = !forEmployer && t.dateOfBirth ? birthDate(t.dateOfBirth) : age !== null ? `${age} years old` : ""
  type Item = { icon: typeof MapPinIcon; text: React.ReactNode }
  const candidates: (Item | false | "" | undefined)[] = [
    place && { icon: MapPinIcon, text: <span className="inline-flex items-center gap-1"><Flag code={person.country} />{place}</span> },
    !forEmployer && person.phone && { icon: PhoneIcon, text: person.phone },
    !forEmployer && person.email && { icon: MailIcon, text: person.email },
    !forEmployer && person.linkedin && { icon: LinkIcon, text: person.linkedin.replace(/^https?:\/\/(www\.)?/, "") },
    born && { icon: CakeIcon, text: [born, t.gender].filter(Boolean).join(" · ") },
  ]
  const items = candidates.filter((x): x is Item => !!x)

  return (
    <header className="pb-[2mm]">
      <div className="flex items-center gap-[6mm]">
        <div className="min-w-0 flex-1">
          {/* Employers only ever see the first name */}
          <h1 className="text-[25pt] leading-[1.1] font-bold tracking-[-0.01em]">{forEmployer ? firstName(person.name) : person.name}</h1>
          {person.title && (
            <p className="mt-[1.5mm] text-[11.5pt] font-normal tracking-[0.02em]" style={{ color: ACCENT }}>
              {person.title}
            </p>
          )}
          {items.length > 0 && (
            <div className="mt-[3.5mm] flex flex-wrap gap-x-[5mm] gap-y-[1.2mm] text-[8.5pt]" style={{ color: MUTED }}>
              {items.map((it, i) => (
                <span key={i} className="inline-flex items-center gap-[1.5mm]">
                  <it.icon className="size-[3.2mm] shrink-0" style={{ color: ACCENT }} />
                  {it.text}
                </span>
              ))}
            </div>
          )}
        </div>
        {person.photoId && <ProfilePhoto photoId={person.photoId} name={person.name} color={person.avatarColor} size={84} />}
      </div>
      <div className="mt-[5mm] h-[0.6mm]" style={{ background: ACCENT }} />
    </header>
  )
}

/** "1995-03-22" -> "22 Mar 1995" */
function birthDate(value: string) {
  const [y, m, d] = value.split("-").map(Number)
  return y && m && d ? `${d} ${MONTHS[m - 1]} ${y}` : ""
}

/** Links to an entry's uploaded certificates (screen only; employers can open them). */
function Attachments({ ids }: { ids: string[] }) {
  if (!ids.length) return null
  return (
    <span className="ml-1 inline-flex flex-wrap gap-1.5 align-middle print:hidden">
      {ids.map((id, i) => (
        <AttachmentLink key={id} id={id} index={i} />
      ))}
    </span>
  )
}

function AttachmentLink({ id, index }: { id: string; index: number }) {
  const file = useStoredFile(id)
  if (!file) return null
  return (
    <a
      href={file.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-0.5 rounded border px-1 text-[7.5pt] hover:bg-black/5"
      style={{ color: ACCENT }}
      title={file.file.name}
    >
      <PaperclipIcon className="size-[2.6mm]" />
      Certificate{index ? ` ${index + 1}` : ""}
    </a>
  )
}
