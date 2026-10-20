"use client"

import { useRef, useState } from "react"
import { FileUpIcon, Loader2Icon, SparklesIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useT } from "@/i18n/provider"
import {
  CV_IMPORT_ACCEPT,
  CV_IMPORT_MAX_BYTES,
  describePath,
  findConflicts,
  mergeCvImport,
  stillMissing,
  type CvImport,
  type ImportConflict,
} from "@/lib/cv-import"
import { cn } from "@/lib/utils"

type Step = { kind: "pick" } | { kind: "reading"; fileName: string } | { kind: "conflicts"; cv: CvImport; conflicts: ImportConflict[] }

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
    toast.success(needsLook.length ? t("cvImport.doneCheck") : t("cvImport.doneAll"))
  }

  const read = async (picked: File) => {
    if (picked.size > CV_IMPORT_MAX_BYTES) return toast.error(t("cvImport.tooBig"))
    setStep({ kind: "reading", fileName: picked.name })
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
            <div className="flex flex-col items-center gap-3 py-8 text-center" role="status">
              <Loader2Icon className="size-8 animate-spin text-primary" />
              <span className="font-medium">{t("cvImport.reading")}</span>
              <span className="max-w-full truncate text-xs text-muted-foreground">{t("cvImport.readingHint", { file: step.fileName })}</span>
            </div>
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
