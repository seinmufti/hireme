"use client"

import { CircleAlertIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { describePath, sectionOf } from "@/lib/cv-import"

/** After a CV import: what the AI wasn't sure about or couldn't find, each linking to its form section. */
export function CvImportReview({ paths, onDismiss }: { paths: string[]; onDismiss: () => void }) {
  if (!paths.length) return null
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1 space-y-2">
        <p className="font-medium">Please check these. Your CV didn&apos;t have them, or they weren&apos;t clear:</p>
        <ul className="flex flex-wrap gap-1.5">
          {paths.map((p) => (
            <li key={p}>
              <button
                type="button"
                className="rounded-full border border-amber-300 bg-white/60 px-2.5 py-0.5 text-xs hover:bg-white"
                onClick={() => document.getElementById(`edit-${sectionOf(p)}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
              >
                {describePath(p)}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Hide" onClick={onDismiss}>
        <XIcon />
      </Button>
    </div>
  )
}

/** Form sections holding a field that needs a look after an import. */
export const sectionsToCheck = (paths: string[]) => new Set(paths.map(sectionOf))
