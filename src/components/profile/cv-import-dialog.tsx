"use client"

import { useEffect, useRef, useState } from "react"
import { FileUpIcon, SparklesIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useT } from "@/i18n/provider"
import type { MessageKey } from "@/i18n/types"
import {
  CV_IMPORT_ACCEPT,
  CV_IMPORT_MAX_BYTES,
  describePath,
  sectionOf,
  findConflicts,
  mergeCvImport,
  stillMissing,
  type CvImport,
  type ImportConflict,
} from "@/lib/cv-import"
import { cn } from "@/lib/utils"

type Step = { kind: "pick" } | { kind: "reading"; fileName: string; estimateMs: number } | { kind: "conflicts"; cv: CvImport; conflicts: ImportConflict[] }

/**
 * How long reading a CV usually takes, from the file alone (the AI doesn't report its progress):
 * plain text is quickest, PDFs take longer the bigger they are, photos are read as images.
 */
function estimateReadingMs(file: File) {
  const name = file.name.toLowerCase()
  if (file.type.startsWith("image/")) return 35_000
  if (name.endsWith(".pdf")) return Math.min(75_000, 25_000 + (file.size / 50_000) * 3_000)
  if (name.endsWith(".docx")) return 25_000
  return 15_000
}

/** The steps shown while a CV is read, from the share of the estimated time that has passed. */
const STAGES: { from: number; key: MessageKey }[] = [
  { from: 0, key: "cvImport.stageUpload" },
  { from: 0.08, key: "cvImport.stageRead" },
  { from: 0.2, key: "cvImport.stageContact" },
  { from: 0.35, key: "cvImport.stageWork" },
  { from: 0.55, key: "cvImport.stageEducation" },
  { from: 0.7, key: "cvImport.stageSkills" },
  { from: 0.82, key: "cvImport.stageCheck" },
  { from: 0.9, key: "cvImport.stageFill" },
]

/**
 * A ring that fills while the CV is read, with "About 20 seconds left". It's an estimate: the ring
 * reaches 90% at the expected time and then creeps on ("Almost done…") until the answer arrives.
 */
function ReadingProgress({ estimateMs, fileName }: { estimateMs: number; fileName: string }) {
  const t = useT()
  const [started] = useState(() => Date.now())
  const [now, setNow] = useState(started)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(timer)
  }, [])
  const elapsed = now - started
  const progress =
    elapsed < estimateMs ? (elapsed / estimateMs) * 0.9 : 0.9 + 0.09 * (1 - Math.exp(-(elapsed - estimateMs) / 20_000))
  const secondsLeft = Math.ceil((estimateMs - elapsed) / 1000)
  const r = 26
  const circumference = 2 * Math.PI * r
  // What it's working on, step by step along the same estimate (the AI doesn't say which part it's on)
  const stage = STAGES.findLast((s) => progress >= s.from) ?? STAGES[0]

  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center" role="status" aria-live="polite">
      <div className="relative size-20">
        <svg viewBox="0 0 64 64" className="size-20 -rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" className="stroke-muted" />
          <circle
            cx="32"
            cy="32"
            r={r}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            className="stroke-primary transition-[stroke-dashoffset] duration-300 ease-linear"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums">
          {Math.round(progress * 100)}%
        </span>
      </div>
      <span key={stage.key} className="animate-in font-medium fade-in">{t(stage.key)}</span>
      <span className="text-sm text-muted-foreground">
        {secondsLeft > 1 ? t("cvImport.secondsLeft", { count: secondsLeft }) : t("cvImport.almostDone")}
      </span>
      <span className="max-w-full truncate text-xs text-muted-foreground">{fileName}</span>
    </div>
  )
}

/** Photos of a CV can be huge; the AI reads them just as well at this size. */
async function shrinkImage(file: File) {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85))
  return blob ? new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }) : file
}

/**
 * "Import from your CV": upload a CV, the AI reads it, and the form is filled in. Fields already filled in
 * are only replaced when the job seeker ticks them. `onApply` gets the merged form values plus the field
 * paths that need a look (unsure or still missing), so their sections can turn yellow.
 */
export function CvImportButton<P extends object, T extends object>({
  profile,
  portfolio,
  onApply,
}: {
  profile: P
  portfolio: T
  onApply: (next: { profile: P; portfolio: T }, needsLook: string[]) => void
}) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>({ kind: "pick" })
  const [replace, setReplace] = useState<Set<string>>(new Set())
  const [dragging, setDragging] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  const apply = (cv: CvImport, chosen: Set<string>) => {
    const next = mergeCvImport(profile, portfolio, cv, chosen)
    const needsLook = [...new Set([...cv.uncertain, ...stillMissing(next.profile as Record<string, unknown>, next.portfolio as Record<string, unknown>)])]
    onApply(next, needsLook)
    setOpen(false)
    if (!needsLook.length) {
      toast.success(t("cvImport.doneAll"))
      return
    }
    // What the CV didn't have or wasn't clear about, as a toast; each item jumps to its part of the form.
    // It stays until closed (click it), since there may be a few things to fix.
    toast.warning(t("cvImport.reviewTitle"), {
      duration: Infinity,
      description: (
        <ul className="mt-1 list-disc space-y-0.5 ps-4">
          {needsLook.map((p) => (
            <li key={p}>
              <button
                type="button"
                className="text-start underline-offset-2 hover:underline"
                onClick={() => document.getElementById(`edit-${sectionOf(p)}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
              >
                {describePath(p, t)}
              </button>
            </li>
          ))}
        </ul>
      ),
    })
  }

  const read = async (picked: File) => {
    if (picked.size > CV_IMPORT_MAX_BYTES) return toast.error(t("cvImport.tooBig"))
    setStep({ kind: "reading", fileName: picked.name, estimateMs: estimateReadingMs(picked) })
    try {
      const file = await shrinkImage(picked)
      const body = new FormData()
      body.append("file", file)
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/cv-import`, { method: "POST", body })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.cv) throw new Error(data?.error ?? t("cvImport.failed"))
      const cv = data.cv as CvImport
      const conflicts = findConflicts(profile as Record<string, unknown>, portfolio as Record<string, unknown>, cv)
      if (conflicts.length) {
        setReplace(new Set())
        setStep({ kind: "conflicts", cv, conflicts })
      } else apply(cv, new Set())
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("cvImport.failed"))
      setStep({ kind: "pick" })
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setStep({ kind: "pick" })
          setOpen(true)
        }}
      >
        <SparklesIcon /> {t("cvImport.button")}
      </Button>

      <Dialog open={open} onOpenChange={(o) => step.kind !== "reading" && setOpen(o)}>
        <DialogContent className="sm:max-w-lg" showCloseButton={step.kind !== "reading"}>
          <DialogHeader>
            <DialogTitle>{t("cvImport.title")}</DialogTitle>
            <DialogDescription>
              {step.kind === "conflicts"
                ? t("cvImport.conflictsIntro")
                : t("cvImport.intro")}
            </DialogDescription>
          </DialogHeader>

          {step.kind === "pick" && (
            <button
              type="button"
              onClick={() => input.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                const file = e.dataTransfer.files[0]
                if (file) read(file)
              }}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:bg-muted/50",
                dragging && "border-primary bg-muted/50"
              )}
            >
              <FileUpIcon className="size-8 text-muted-foreground" />
              <span className="font-medium">{t("cvImport.choose")}</span>
              <span className="text-xs text-muted-foreground">{t("cvImport.types")}</span>
            </button>
          )}
          <input
            ref={input}
            type="file"
            accept={CV_IMPORT_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ""
              if (file) read(file)
            }}
          />

          {step.kind === "reading" && (
            <ReadingProgress estimateMs={step.estimateMs} fileName={step.fileName} />
          )}

          {step.kind === "conflicts" && (
            <>
              <ul className="max-h-80 space-y-2 overflow-y-auto">
                {step.conflicts.map((c) => (
                  <li key={c.path}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3">
                      <Checkbox
                        className="mt-0.5"
                        checked={replace.has(c.path)}
                        onCheckedChange={(on) =>
                          setReplace((s) => {
                            const next = new Set(s)
                            if (on) next.add(c.path)
                            else next.delete(c.path)
                            return next
                          })
                        }
                      />
                      <span className="min-w-0 space-y-0.5">
                        <span className="block font-medium">{describePath(c.path, t)}</span>
                        <span className="block truncate text-muted-foreground">{t("cvImport.now", { value: c.current })}</span>
                        <span className="block truncate">{t("cvImport.fromCv", { value: c.imported })}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => apply(step.cv, new Set())}>
                  {t("cvImport.keepMine")}
                </Button>
                <Button type="button" onClick={() => apply(step.cv, replace)}>
                  {replace.size ? t("cvImport.replaceAndImport", { count: replace.size }) : t("cvImport.import")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
