"use client"

import { Share2Icon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useT } from "@/i18n/provider"
import { BASE_PATH } from "@/lib/mode"
import type { Job } from "@/lib/types"

/**
 * Shares the job's link: the phone's (or browser's) share sheet where there is one, otherwise the link is copied.
 * Shows only the icon on small screens.
 */
export function ShareJobButton({ job, className }: { job: Job; className?: string }) {
  const t = useT()
  const share = async () => {
    const url = `${window.location.origin}${BASE_PATH}/jobs/${job.id}`
    const title = `${job.title} · ${job.company}`
    if (navigator.share) {
      try {
        await navigator.share({ title, text: title, url })
        return
      } catch (e) {
        // Closing the share sheet isn't an error
        if ((e as Error).name === "AbortError") return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      toast.success(t("jobs.linkCopied"))
    } catch {
      toast.error(t("jobs.linkNotCopied"))
    }
  }
  return (
    <Button type="button" variant="outline" className={className} onClick={share} aria-label={t("jobs.share")} title={t("jobs.share")}>
      <Share2Icon /> <span className="hidden sm:inline">{t("jobs.share")}</span>
    </Button>
  )
}
