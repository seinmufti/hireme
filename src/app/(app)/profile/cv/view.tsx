"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeftIcon, CrownIcon, DownloadIcon, LoaderCircleIcon, PencilIcon } from "lucide-react"
import { CvDocument } from "@/components/cv/cv-document"
import { printCv } from "@/components/cv/print-cv"
import { Button, buttonVariants } from "@/components/ui/button"
import { EMPTY_PORTFOLIO, toPortfolioInput } from "@/components/profile/portfolio-fields"
import { ageFrom } from "@/lib/format"
import { useIsPremium } from "@/lib/premium"
import { useStore } from "@/lib/store"
import { useRoleGuard } from "@/lib/use-role-guard"

// The job seeker's CV as an A4 page, exactly as it downloads. Editing happens on the profile page.
export function CvView() {
  const user = useRoleGuard(["SEEKER"])
  const talent = useStore((s) => s.talents.find((t) => t.userId === user?.id)) ?? null
  const page = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const premium = useIsPremium(user)
  if (!user) return null

  const download = async () => {
    if (!page.current) return
    setDownloading(true)
    try {
      await printCv(page.current, `${user.name} CV`)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="mx-auto flex w-[210mm] max-w-full items-center gap-3">
        <Link href="/profile" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeftIcon /> Profile
        </Link>
        <h1 className="text-lg font-semibold tracking-tight">CV preview</h1>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/profile?edit=1" className={buttonVariants({ variant: "outline" })}>
            <PencilIcon /> Edit
          </Link>
          <Button onClick={download} disabled={downloading}>
            {downloading ? <LoaderCircleIcon className="animate-spin" /> : <DownloadIcon />} Download PDF
          </Button>
        </div>
      </div>
      <p className="mx-auto flex w-[210mm] max-w-full items-center gap-1.5 text-xs text-muted-foreground">
        {premium ? (
          <>
            <CrownIcon className="size-3.5 text-amber-600" /> Premium: unlimited downloads without a watermark. In the print window,
            choose &ldquo;Save as PDF&rdquo;.
          </>
        ) : (
          <>Free CVs download with a HireMe watermark. Premium removes it and gives unlimited downloads for a year.</>
        )}
      </p>
      <CvDocument
        ref={page}
        person={user}
        talent={talent ? toPortfolioInput(talent) : EMPTY_PORTFOLIO}
        premium={premium}
        age={ageFrom(talent?.dateOfBirth ?? "")}
      />
    </div>
  )
}
