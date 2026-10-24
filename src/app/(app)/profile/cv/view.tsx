"use client"

import Link from "next/link"
import { ArrowLeftIcon, PencilIcon } from "lucide-react"
import { CvDocument } from "@/components/cv/cv-document"
import { buttonVariants } from "@/components/ui/button"
import { EMPTY_PORTFOLIO, toPortfolioInput } from "@/components/profile/portfolio-fields"
import { useT } from "@/i18n/provider"
import { ageFrom } from "@/lib/format"
import { useIsPremium } from "@/lib/premium"
import { useStore } from "@/lib/store"
import { useRoleGuard } from "@/lib/use-role-guard"

// The job seeker's CV as an A4 page, to look at (it can't be downloaded). Editing happens on the profile page.
export function CvView() {
  const user = useRoleGuard(["SEEKER"])
  const t = useT()
  const talent = useStore((s) => s.talents.find((t) => t.userId === user?.id)) ?? null
  const premium = useIsPremium(user)
  if (!user) return null

  return (
    <div className="space-y-6">
      <div className="mx-auto flex w-[210mm] max-w-full items-center gap-3">
        <Link href="/overview" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeftIcon className="rtl:rotate-180" /> {t("cvPreview.back")}
        </Link>
        <h1 className="hidden text-lg font-semibold tracking-tight sm:block">{t("cvPreview.title")}</h1>
        <div className="ms-auto flex items-center gap-2">
          <Link href="/overview?edit=1" className={buttonVariants({ variant: "outline" })}>
            <PencilIcon /> {t("common.edit")}
          </Link>
        </div>
      </div>
      <CvDocument
        person={user}
        talent={talent ? toPortfolioInput(talent) : EMPTY_PORTFOLIO}
        premium={premium}
        age={ageFrom(talent?.dateOfBirth ?? "")}
      />
    </div>
  )
}
