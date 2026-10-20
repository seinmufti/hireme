"use client"

import { GlobeIcon, LinkIcon, MailIcon, MapPinIcon, PaperclipIcon, PhoneIcon } from "lucide-react"
import { Logo } from "@/components/logo"
import { useStoredFile } from "@/lib/files"
import { degreeDuration, formatDuration, jobMonths, projectDuration, totalMonths } from "@/lib/format"
import { countryName, LANGUAGE_LEVELS } from "@/lib/options"
import type { TalentInput, User } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Flag, ProfilePhoto } from "./photo"

/**
 * Who the CV is about. Employers get a version without contact details, address and references
 * (pass `forEmployer`); the job seeker's own preview and download have everything.
 */
export type CvPerson = Pick<User, "name" | "title" | "photoId" | "avatarColor" | "country" | "city"> &
  Partial<Pick<User, "email" | "phone" | "linkedin" | "address">>

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const SHORT_MONTH = (value: string) => {
  const [y, m] = value.split("-").map(Number)
  if (!y || !m) return ""
  return y && m >= 1 && m <= 12 ? `${MONTHS[m - 1]} ${y}` : ""
}

const period = (start: string, end: string, current = false) => {
  const from = SHORT_MONTH(start)
  const to = current ? "Present" : SHORT_MONTH(end)
  return [from, to].filter(Boolean).join(" – ")
}

const levelName = (v: string) => LANGUAGE_LEVELS.find((l) => l.value === v)?.label.replace(" · ", " – ") ?? v
const bullets = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean)

/** What the CV shows of the portfolio. Employers get the age, never the exact date of birth. */
export type CvTalent = Omit<TalentInput, "dateOfBirth" | "published" | "workPreference">

/** An A4 page with the CV. Text is sized in points, like a printed document. */
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
  const location = [person.city, countryName(person.country)].filter(Boolean).join(", ")
  const contact = forEmployer
    ? []
    : [
        person.phone && { icon: PhoneIcon, text: person.phone },
        person.email && { icon: MailIcon, text: person.email },
        person.linkedin && { icon: LinkIcon, text: person.linkedin.replace(/^https?:\/\/(www\.)?/, "") },
      ].filter((x): x is { icon: typeof PhoneIcon; text: string } => !!x)

  const jobs = t.experiences.filter((e) => e.title || e.employer)
  const degrees = t.degrees.filter((d) => d.name || d.institution || d.level)
  const languages = t.languages.filter((l) => l.language)
  const certifications = t.certifications.filter((c) => c.title)
  const projects = t.projects.filter((p) => p.name)
  const hasSkills = t.hardSkills.length > 0 || t.softSkills.length > 0

  return (
    // The CV is always in English, so it stays left to right even when the app is in Arabic or Kurdish
    <div
      ref={ref}
      dir="ltr"
      className={cn(
        "cv-page relative mx-auto flex min-h-[297mm] w-[210mm] flex-col bg-white px-[16mm] pt-[14mm] pb-[10mm] text-[9.5pt] leading-[1.45] text-neutral-800 shadow-lg ring-1 ring-black/5 [print-color-adjust:exact]",
        className
      )}
    >
      {/* Header: photo, name, profession, location and contact details */}
      <header className="flex items-center gap-[6mm] border-b-2 border-primary pb-[5mm]">
        <ProfilePhoto photoId={person.photoId} name={person.name} color={person.avatarColor} size={92} />
        <div className="min-w-0 flex-1">
          <h1 className="text-[22pt] leading-tight font-bold tracking-tight text-neutral-900">{person.name}</h1>
          {person.title && <p className="mt-0.5 text-[11.5pt] font-medium text-primary">{person.title}</p>}
          <div className="mt-[2.5mm] flex flex-wrap gap-x-[5mm] gap-y-[1mm] text-[8.5pt] text-neutral-600">
            {location && (
              <span className="flex items-center gap-1.5">
                <MapPinIcon className="size-[3.2mm] shrink-0 text-primary" />
                <Flag code={person.country} />
                {!forEmployer && person.address ? `${person.address}, ${location}` : location}
              </span>
            )}
            {age !== null && <span>{age} years old{t.gender ? ` · ${t.gender}` : ""}</span>}
            {contact.map((c) => (
              <span key={c.text} className="flex items-center gap-1.5">
                <c.icon className="size-[3.2mm] shrink-0 text-primary" />
                {c.text}
              </span>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-[5mm] pt-[5mm]">
        {t.summary && (
          <Section title="About me">
            <p className="text-justify">{t.summary}</p>
          </Section>
        )}

        {jobs.length > 0 && (
          <Section title="Work experience" note={totalMonths(jobs) > 0 ? `${formatDuration(totalMonths(jobs))} in total` : ""}>
            <div className="space-y-[3.5mm]">
              {jobs.map((e) => (
                <article key={e.id} className="break-inside-avoid">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-semibold text-neutral-900">
                      {e.title}
                      {e.employer && <span className="font-normal text-neutral-600"> · {e.employer}</span>}
                    </h3>
                    <span className="shrink-0 text-[8.5pt] text-neutral-500">
                      {[period(e.start, e.end, e.current), jobMonths(e) > 0 && formatDuration(jobMonths(e))].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                  <p className="text-[8.5pt] text-neutral-500">{[e.category, e.contractType].filter(Boolean).join(" · ")}</p>
                  {e.description && (
                    <ul className="mt-[1mm] list-disc space-y-[0.5mm] pl-[4.5mm] marker:text-primary">
                      {bullets(e.description).map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  )}
                  {e.reference && <p className="mt-[1mm] text-[8.5pt] text-neutral-500 italic">Reference available on request</p>}
                </article>
              ))}
            </div>
          </Section>
        )}

        {degrees.length > 0 && (
          <Section title="Education">
            <div className="space-y-[2.5mm]">
              {degrees.map((d) => (
                <article key={d.id} className="break-inside-avoid">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-semibold text-neutral-900">{d.name || d.level}</h3>
                    <span className="shrink-0 text-[8.5pt] text-neutral-500">
                      {[[d.startYear, d.endYear && (d.status === "Studying" ? `expected ${d.endYear}` : d.endYear)].filter(Boolean).join(" – "), degreeDuration(d)].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                  <p className="text-neutral-600">{[d.institution, d.field && d.field !== d.name ? d.field : ""].filter(Boolean).join(" · ")}</p>
                  {showAttachments && <Attachments ids={d.attachmentIds} />}
                </article>
              ))}
            </div>
          </Section>
        )}

        {hasSkills && (
          <Section title="Core competencies">
            <div className="grid grid-cols-2 gap-[6mm]">
              {[
                { title: "Hard skills", list: t.hardSkills },
                { title: "Soft skills", list: t.softSkills },
              ]
                .filter((g) => g.list.length)
                .map((g) => (
                  <div key={g.title}>
                    <h3 className="mb-[1mm] text-[8.5pt] font-semibold tracking-wide text-neutral-500 uppercase">{g.title}</h3>
                    <ul className="list-disc space-y-[0.3mm] pl-[4.5mm] marker:text-primary">
                      {g.list.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          </Section>
        )}

        {languages.length > 0 && (
          <Section title="Languages">
            <div className="grid grid-cols-2 gap-x-[6mm] gap-y-[1.5mm]">
              {languages.map((l) => (
                <div key={l.language} className="break-inside-avoid">
                  <span className="font-semibold text-neutral-900">{l.language}</span>
                  <span className="text-neutral-600">
                    {" "}
                    {l.speaking === l.reading ? `– ${levelName(l.speaking)}` : `– Speaking ${l.speaking}, Reading ${l.reading}`}
                  </span>
                  {showAttachments && <Attachments ids={l.attachmentIds} />}
                </div>
              ))}
            </div>
          </Section>
        )}

        {certifications.length > 0 && (
          <Section title="Licenses & certifications">
            <div className="space-y-[1.5mm]">
              {certifications.map((c) => (
                <div key={c.id} className="break-inside-avoid">
                  <div className="flex items-baseline justify-between gap-4">
                    <span>
                      <span className="font-semibold text-neutral-900">{c.title}</span>
                      {c.institution && <span className="text-neutral-600"> · {c.institution}</span>}
                    </span>
                    <span className="shrink-0 text-[8.5pt] text-neutral-500">{SHORT_MONTH(c.issued)}</span>
                  </div>
                  {showAttachments && <Attachments ids={c.attachmentIds} />}
                </div>
              ))}
            </div>
          </Section>
        )}

        {projects.length > 0 && (
          <Section title="Projects & activities">
            <div className="space-y-[2.5mm]">
              {projects.map((p) => (
                <article key={p.id} className="break-inside-avoid">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-semibold text-neutral-900">{p.name}</h3>
                    <span className="shrink-0 text-[8.5pt] text-neutral-500">
                      {[period(p.start, p.end, !!p.start && !p.end), projectDuration(p)].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                  {p.link && (
                    <p className="flex items-center gap-1 text-[8.5pt] text-primary">
                      <GlobeIcon className="size-[3mm]" />
                      {p.link.replace(/^https?:\/\/(www\.)?/, "")}
                    </p>
                  )}
                  {p.description && <p className="text-neutral-700">{p.description}</p>}
                </article>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* Always at the bottom, also on premium CVs */}
      <footer className="mt-[6mm] flex items-center justify-center gap-2 border-t pt-[3mm] text-[8pt] text-neutral-500">
        <Logo size={22} className="rounded-[4px]" />
        <span>
          Created with <span className="font-semibold text-primary">HireMe</span>
        </span>
      </footer>

      {!premium && (
        // Free CVs: "HireMe" repeated across the whole page, like a stock photo; rows are staggered
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden select-none">
          <div className="absolute -inset-[40%] flex -rotate-30 flex-col justify-center gap-[14mm]">
            {Array.from({ length: 22 }, (_, row) => (
              <div key={row} className={cn("flex gap-[16mm] whitespace-nowrap", row % 2 && "translate-x-[22mm]")}>
                {Array.from({ length: 12 }, (_, i) => (
                  <span key={i} className="text-[20pt] font-black tracking-wider text-primary/[0.13]">
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

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-[2mm] border-b border-neutral-200 pb-[1mm] text-[9pt] font-bold tracking-[0.12em] text-primary uppercase break-after-avoid">
        {title}
        {note && <span className="ml-2 font-normal tracking-normal text-neutral-500 normal-case">· {note}</span>}
      </h2>
      {children}
    </section>
  )
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
      className="inline-flex items-center gap-0.5 rounded border px-1 text-[7.5pt] text-primary hover:bg-primary/5"
      title={file.file.name}
    >
      <PaperclipIcon className="size-[2.6mm]" />
      Certificate{index ? ` ${index + 1}` : ""}
    </a>
  )
}
