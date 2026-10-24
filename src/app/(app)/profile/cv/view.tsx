"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeftIcon, DownloadIcon, LoaderCircleIcon, LockIcon } from "lucide-react"
import { CvDocument } from "@/components/cv/cv-document"
import { printCv } from "@/components/cv/print-cv"
import { Button, buttonVariants } from "@/components/ui/button"
import { EMPTY_PORTFOLIO, toPortfolioInput } from "@/components/profile/portfolio-fields"
import { useT } from "@/i18n/provider"
import { ageFrom } from "@/lib/format"
import { PremiumContactDialog } from "@/components/premium-contact"
import { useIsPremium } from "@/lib/premium"
import { useStore } from "@/lib/store"
import { useRoleGuard } from "@/lib/use-role-guard"

// The job seeker's CV as an A4 page. Premium accounts can download it; editing happens on the profile page.
export function CvView() {
  const user = useRoleGuard(["SEEKER"])
  const t = useT()
  const talent = useStore((s) => s.talents.find((t) => t.userId === user?.id)) ?? null
  const page = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const premium = useIsPremium(user)
  const [contactOpen, setContactOpen] = useState(false)
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
        <Link href="/overview" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeftIcon className="rtl:rotate-180" /> {t("cvPreview.back")}
        </Link>
        <h1 className="hidden text-lg font-semibold tracking-tight sm:block">{t("cvPreview.title")}</h1>
        {premium && (
          <Button className="ms-auto" onClick={download} disabled={downloading}>
            {downloading ? <LoaderCircleIcon className="animate-spin" /> : <DownloadIcon />} {t("cvPreview.download")}
          </Button>
        )}
      </div>
      <CvDocument
        ref={page}
        person={user}
        talent={talent ? toPortfolioInput(talent) : EMPTY_PORTFOLIO}
        age={ageFrom(talent?.dateOfBirth ?? "")}
        locked={
          // Without Premium the CV shows up to work experience; the rest is for Premium
          !premium && (
            <div dir="auto" className="mt-[6mm] flex flex-col items-center gap-[3mm] rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-[8mm] py-[8mm] text-center font-sans">
              <LockIcon className="size-6 text-neutral-500" />
              <p className="text-[12pt] font-semibold">{t("cvPreview.lockedTitle")}</p>
              <p className="max-w-[120mm] text-[10pt] text-neutral-600">{t("cvPreview.lockedBody")}</p>
              {/* No online payment yet: how to contact HireMe for it */}
              <Button onClick={() => setContactOpen(true)}>{t("cvPreview.getPremium")}</Button>
            </div>
          )
        }
      />
      <PremiumContactDialog open={contactOpen} onOpenChange={setContactOpen} />
    </div>
  )
}
