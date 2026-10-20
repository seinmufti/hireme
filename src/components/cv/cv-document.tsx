"use client"

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react"
import { CakeIcon, GlobeIcon, HomeIcon, LinkIcon, MailIcon, PaperclipIcon, PhoneIcon } from "lucide-react"
import { Logo } from "@/components/logo"
import { useStoredFile } from "@/lib/files"
import { countryName } from "@/lib/options"
import type { TalentInput, User } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Flag, ProfilePhoto } from "./photo"

/**
 * Who the CV is about. Employers get a version without contact details, address and references
 * (pass `forEmployer`); the job seeker's own preview and download have everything.
 */
export type CvPerson = Pick<User, "name" | "title" | "photoId" | "avatarColor" | "country" | "city"> &
  Partial<Pick<User, "email" | "phone" | "linkedin" | "address">>

/** What the CV shows of the portfolio. Employers get the age, never the exact date of birth. */
export type CvTalent = Omit<TalentInput, "dateOfBirth" | "published" | "workPreference"> & { dateOfBirth?: string }

// The look of a classic ATS CV: sky-blue accents, dark text, mostly italic
const ACCENT = "#36B1DA"
const INK = "#272529"

// A4 in millimetres; the page's content box is what's left inside the margins
const PAGE_W = 210
const PAGE_H = 297
const MARGIN_X = 14
const MARGIN_TOP = 14
const MARGIN_BOTTOM = 20 // room for the HireMe logo
const CONTENT_H_MM = PAGE_H - MARGIN_TOP - MARGIN_BOTTOM
const MM = 96 / 25.4 // CSS pixels per millimetre

/** "2022-03" -> "03.2022" */
const monthDot = (value: string) => {
  const [y, m] = (value ?? "").split("-")
  return y && m ? `${m}.${y}` : y || ""
}
const range = (from: string, to: string) => [from, to].filter(Boolean).join(" - ")

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
 * The CV as A4 pages, laid out like a classic ATS CV. The content is cut into blocks (the header, each job,
 * each degree, ...), measured, and placed page by page, so a job or degree never splits across pages.
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
    <div dir="ltr" className={cn("relative", className)}>
      <div ref={ref} className="cv-pages flex flex-col items-center gap-[8mm]">
        {pages.map((indexes, p) => (
          <Page key={p} premium={premium}>
            {indexes.map((i) => (
              <Fragment key={blocks[i]?.key ?? i}>{blocks[i]?.node}</Fragment>
            ))}
          </Page>
        ))}
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

const CV_TEXT = "font-[family-name:var(--font-cv)] text-[9.5pt] leading-[1.45] italic"
const HEADING = "font-[family-name:var(--font-cv-heading)] not-italic font-bold uppercase tracking-tight"

/** One A4 page: corner triangles, the HireMe logo at the bottom and, on free CVs, the watermark. */
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
      {/* Sky-blue corners, top right and bottom left */}
      <div aria-hidden className="absolute top-0 right-0 h-[16mm] w-[62mm]" style={{ background: ACCENT, clipPath: "polygon(0 0, 100% 0, 100% 100%)" }} />
      <div aria-hidden className="absolute bottom-0 left-0 h-[13mm] w-[48mm]" style={{ background: ACCENT, clipPath: "polygon(0 0, 100% 100%, 0 100%)" }} />

      {children}

      {/* Always at the bottom of every page, also on premium CVs */}
      {/* Centred at the bottom of the page */}
      <div className="absolute bottom-[5mm] left-1/2 flex -translate-x-1/2 items-center gap-2 text-[12pt] font-semibold not-italic text-neutral-700">
        <Logo size={34} className="rounded-[6px]" />
        HireMe
      </div>

      {!premium && (
        // Free CVs: "HireMe" repeated across the whole page, like a stock photo; rows are staggered
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden select-none">
          <div className="absolute -inset-[40%] flex -rotate-30 flex-col justify-center gap-[14mm]">
            {Array.from({ length: 22 }, (_, row) => (
              <div key={row} className={cn("flex gap-[16mm] whitespace-nowrap", row % 2 && "translate-x-[22mm]")}>
                {Array.from({ length: 12 }, (_, i) => (
                  <span key={i} className="text-[20pt] font-black tracking-wider not-italic text-primary/[0.13]">
                    HireMe
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className={cn(HEADING, "mb-[3mm] pt-[4mm] pb-[1mm] text-[13pt]")} style={{ borderBottom: `1.5px solid ${ACCENT}` }}>
      {children}
    </h2>
  )
}

type Block = { key: string; node: React.ReactNode }

/** The CV cut into blocks that each stay on one page. A section's title travels with its first entry. */
function buildBlocks(person: CvPerson, t: CvTalent, age: number | null, forEmployer: boolean, showAttachments: boolean): Block[] {
  const blocks: Block[] = [{ key: "header", node: <Header person={person} t={t} age={age} forEmployer={forEmployer} /> }]

  const section = (key: string, title: string, items: { key: string; node: React.ReactNode }[]) => {
    items.forEach((item, i) =>
      blocks.push({
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

  const jobs = t.experiences.filter((e) => e.title || e.employer)
  section(
    "work",
    "Experience",
    jobs.map((e) => ({
      key: e.id,
      node: (
        <article className="pb-[3.5mm]">
          <p className="font-bold">{range(monthDot(e.start), e.current ? "present" : monthDot(e.end))}</p>
          <p className="font-bold">{e.employer}</p>
          <p>{[e.title, e.contractType].filter(Boolean).join(" · ")}</p>
          {e.description && (
            <ul className="mt-[1mm] list-disc space-y-[0.4mm] ps-[6mm] marker:text-[7pt]">
              {lines(e.description).map((b, i) => (
                <li key={i}>
                  <Rich text={b} />
                </li>
              ))}
            </ul>
          )}
          {e.reference && <p className="mt-[1mm] text-[8.5pt] text-neutral-500">Reference available on request</p>}
        </article>
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
        <article className="pb-[3mm]">
          <p>{range(d.startYear, d.endYear && (d.status === "Studying" ? `expected ${d.endYear}` : d.endYear)) || (d.status === "Studying" ? "present" : "")}</p>
          <p className="font-bold">{d.institution}</p>
          <p>{[d.name || d.level, d.field && d.field !== d.name ? d.field : ""].filter(Boolean).join(" / ")}</p>
          {showAttachments && <Attachments ids={d.attachmentIds} />}
        </article>
      ),
    }))
  )

  const skills = [...t.hardSkills, ...t.softSkills]
  if (skills.length) {
    section("skills", "Core competence", [
      { key: "all", node: <p className="pb-[3mm] text-justify">{skills.map((s) => `* ${s}`).join(" ")}</p> },
    ])
  }

  const projects = t.projects.filter((p) => p.name)
  section(
    "projects",
    "Projects & activities",
    projects.map((p) => ({
      key: p.id,
      node: (
        <article className="pb-[2.5mm]">
          <p className="font-bold">
            {p.name}
            {(p.start || p.end) && <span className="font-normal"> · {range(monthDot(p.start), p.end ? monthDot(p.end) : "present")}</span>}
          </p>
          {p.link && (
            <p className="flex items-center gap-1 text-[8.5pt] underline" style={{ color: ACCENT }}>
              <GlobeIcon className="size-[3mm]" />
              {p.link.replace(/^https?:\/\/(www\.)?/, "")}
            </p>
          )}
          {p.description && <p>{p.description}</p>}
        </article>
      ),
    }))
  )

  // Languages and licenses side by side, like the bottom of a classic ATS CV
  const languages = t.languages.filter((l) => l.language)
  const certifications = t.certifications.filter((c) => c.title)
  if (languages.length || certifications.length) {
    blocks.push({
      key: "languages-licenses",
      node: (
        <div className="grid grid-cols-2 gap-[8mm] pb-[3mm]">
          <div>
            {languages.length > 0 && (
              <>
                <SectionTitle>Languages</SectionTitle>
                <ul className="space-y-[1mm]">
                  {languages.map((l) => (
                    <li key={l.language}>
                      {l.language} - {LEVEL_WORDS[l.speaking] ?? l.speaking}
                      {showAttachments && <Attachments ids={l.attachmentIds} />}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <div>
            {certifications.length > 0 && (
              <>
                <SectionTitle>Licenses & certifications</SectionTitle>
                <ul className="list-disc space-y-[0.6mm] ps-[5mm] marker:text-[7pt]">
                  {certifications.map((c) => (
                    <li key={c.id}>
                      {c.title}
                      {c.institution && ` by ${c.institution}`}
                      {showAttachments && <Attachments ids={c.attachmentIds} />}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      ),
    })
  }

  return blocks
}

/** Name, profession, summary and the contact row with round sky-blue icons. */
function Header({ person, t, age, forEmployer }: { person: CvPerson; t: CvTalent; age: number | null; forEmployer: boolean }) {
  const where = [person.city, countryName(person.country)].filter(Boolean).join(" / ")
  const born = !forEmployer && t.dateOfBirth ? monthDayYear(t.dateOfBirth) : age !== null ? `${age} years old` : ""
  type Item = { icon: typeof HomeIcon; lines: React.ReactNode[] }
  const candidates: (Item | false | "" | undefined)[] = [
    where && { icon: HomeIcon, lines: [<span key="w" className="flex items-center gap-1.5"><Flag code={person.country} />{where}</span>, !forEmployer && person.address] },
    born && { icon: CakeIcon, lines: [born, t.gender] },
    !forEmployer && person.phone && { icon: PhoneIcon, lines: [person.phone] },
    !forEmployer && person.email && { icon: MailIcon, lines: [person.email] },
    !forEmployer && person.linkedin && { icon: LinkIcon, lines: [person.linkedin.replace(/^https?:\/\/(www\.)?/, "")] },
  ]
  const items = candidates.filter((x): x is Item => !!x)

  return (
    <header className="pb-[2mm]">
      <div className="flex items-start gap-[6mm]">
        <div className="min-w-0 flex-1">
          <h1 className={cn(HEADING, "text-[26pt] leading-[1.1] normal-case")}>{person.name}</h1>
          {person.title && <p className="mt-[1.5mm] text-[10.5pt] font-bold">{person.title}</p>}
        </div>
        {person.photoId && <ProfilePhoto photoId={person.photoId} name={person.name} color={person.avatarColor} size={86} className="mt-[6mm]" />}
      </div>
      {t.summary && <p className="mt-[3mm] text-justify">{t.summary}</p>}
      {items.length > 0 && (
        <div className="mt-[5mm] flex flex-wrap gap-x-[8mm] gap-y-[3mm]">
          {items.map((it, i) => (
            <div key={i} className="flex items-start gap-[2.5mm]">
              <span className="flex size-[6.5mm] shrink-0 items-center justify-center rounded-full text-white" style={{ background: ACCENT }}>
                <it.icon className="size-[3.6mm]" />
              </span>
              <div className="pt-[0.6mm]">
                {it.lines.filter(Boolean).map((l, j) => (
                  <div key={j}>{l}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </header>
  )
}

/** "1995-03-22" -> "03/22/1995", as on the reference CV */
function monthDayYear(value: string) {
  const [y, m, d] = value.split("-")
  return y && m && d ? `${m}/${d}/${y}` : ""
}

/** Links to an entry's uploaded certificates (screen only; employers can open them). */
function Attachments({ ids }: { ids: string[] }) {
  if (!ids.length) return null
  return (
    <span className="ml-1 inline-flex flex-wrap gap-1.5 align-middle not-italic print:hidden">
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
