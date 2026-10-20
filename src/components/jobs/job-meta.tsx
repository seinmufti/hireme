import { BriefcaseIcon, Building2Icon, ClockIcon, GlobeIcon, LaptopIcon, MapPinIcon, TagIcon } from "lucide-react"
import { locationLabel } from "@/lib/jobs"
import { timeAgo } from "@/lib/format"
import type { Job } from "@/lib/types"
import { cn } from "@/lib/utils"

/** Company, location, contract type, category and when it was posted. */
export function jobFacts(job: Job) {
  return [
    { icon: Building2Icon, label: "Company", value: job.company },
    {
      icon: job.location.remote ? LaptopIcon : job.location.international ? GlobeIcon : MapPinIcon,
      label: "Location",
      value: locationLabel(job.location),
    },
    { icon: BriefcaseIcon, label: "Contract", value: job.contractType },
    { icon: TagIcon, label: "Category", value: job.category },
    { icon: ClockIcon, label: "Posted", value: `Posted ${timeAgo(job.createdAt)}` },
  ]
}

/** The job's skills as chips; the ones the job seeker has are highlighted. */
export function SkillChips({ skills, have = [], limit, className }: { skills: string[]; have?: string[]; limit?: number; className?: string }) {
  if (!skills.length) return null
  const mine = new Set(have.map((s) => s.toLowerCase()))
  const shown = limit ? skills.slice(0, limit) : skills
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {shown.map((s) => (
        <li
          key={s}
          className={cn(
            "rounded-full border px-2 py-0.5 text-xs",
            mine.has(s.toLowerCase()) ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "bg-muted/50 text-foreground"
          )}
        >
          {s}
        </li>
      ))}
      {limit && skills.length > limit && <li className="px-1 py-0.5 text-xs text-muted-foreground">+{skills.length - limit}</li>}
    </ul>
  )
}

/** The description as written: lines starting with "-" or "•" become bullet points, the rest paragraphs. */
export function JobDescription({ text }: { text: string }) {
  const blocks: { bullets: boolean; lines: string[] }[] = []
  for (const raw of text.split("\n")) {
    const line = raw.trim()
    if (!line) {
      blocks.push({ bullets: false, lines: [] })
      continue
    }
    const bullet = /^[-•*]\s+/.test(line)
    const last = blocks[blocks.length - 1]
    const content = line.replace(/^[-•*]\s+/, "")
    if (last && last.bullets === bullet && last.lines.length) last.lines.push(content)
    else blocks.push({ bullets: bullet, lines: [content] })
  }
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {blocks
        .filter((b) => b.lines.length)
        .map((b, i) =>
          b.bullets ? (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {b.lines.map((l, j) => (
                <li key={j}>{l}</li>
              ))}
            </ul>
          ) : (
            <p key={i}>{b.lines.join(" ")}</p>
          )
        )}
    </div>
  )
}
