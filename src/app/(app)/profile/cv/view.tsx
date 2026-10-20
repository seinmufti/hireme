"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeftIcon, DownloadIcon, LoaderCircleIcon, PencilIcon } from "lucide-react"
import { CvDocument } from "@/components/cv/cv-document"
import { printCv } from "@/components/cv/print-cv"
import { Button, buttonVariants } from "@/components/ui/button"
import { EMPTY_PORTFOLIO, toPortfolioInput } from "@/components/profile/portfolio-fields"
import { useT } from "@/i18n/provider"
import { ageFrom } from "@/lib/format"
import { useIsPremium } from "@/lib/premium"
import { useStore } from "@/lib/store"
import { useRoleGuard } from "@/lib/use-role-guard"

// The job seeker's CV as an A4 page, exactly as it downloads. Editing happens on the profile page.
export function CvView() {
  const user = useRoleGuard(["SEEKER"])
  const t = useT()
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
          <ArrowLeftIcon className="rtl:rotate-180" /> {t("cvPreview.back")}
        </Link>
        <h1 className="text-lg font-semibold tracking-tight">{t("cvPreview.title")}</h1>
        <div className="ms-auto flex items-center gap-2">
          <Link href="/profile?edit=1" className={buttonVariants({ variant: "outline" })}>
            <PencilIcon /> {t("common.edit")}
          </Link>
          <Button onClick={download} disabled={downloading}>
            {downloading ? <LoaderCircleIcon className="animate-spin" /> : <DownloadIcon />} {t("cvPreview.download")}
          </Button>
        </div>
      </div>
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
