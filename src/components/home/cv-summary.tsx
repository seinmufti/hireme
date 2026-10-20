"use client"

import Link from "next/link"
import { CircleAlertIcon, CircleCheckIcon, EyeIcon, EyeOffIcon, FileTextIcon } from "lucide-react"
import { UserAvatar } from "@/components/user-avatar"
import { buttonVariants } from "@/components/ui/button"
import { useT } from "@/i18n/provider"
import { formatJobPeriod } from "@/lib/format"
import { listingSectionsMissing } from "@/lib/store"
import { cn } from "@/lib/utils"
import type { HomeTalent, HomeUser } from "./home-data"

/** The middle of Home: the job seeker's CV at a glance, with Preview CV and Edit CV. */
export function CvSummary({ user, talent }: { user: HomeUser; talent: HomeTalent | null }) {
  const t = useT()
  const missing = listingSectionsMissing(user, talent)
  const visible = talent?.published ?? true
  const status = !visible
    ? { icon: EyeOffIcon, text: t("home.cvHidden"), className: "border-border bg-muted text-muted-foreground" }
    : missing.length
      ? { icon: CircleAlertIcon, text: t("home.cvIncomplete"), className: "border-amber-300 bg-amber-50 text-amber-900" }
      : { icon: CircleCheckIcon, text: t("home.cvComplete"), className: "border-emerald-300 bg-emerald-50 text-emerald-900" }
  const latest = talent?.experiences[0]
  const skills = [...(talent?.hardSkills ?? []), ...(talent?.softSkills ?? [])]

  return (
    <section className="rounded-xl border bg-card">
      <div className="flex items-start gap-4 p-5">
        <UserAvatar name={user.name} color={user.avatarColor} size={64} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("home.yourCv")}</p>
          <h2 className="truncate text-xl font-semibold tracking-tight">{user.name}</h2>
          {user.title ? (
            <p className="truncate text-sm text-muted-foreground">{user.title}</p>
          ) : (
            <Link href="/profile" className="text-sm text-primary hover:underline">
              {t("home.noTitle")}
            </Link>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <Link href="/profile/cv" className={buttonVariants({ size: "sm" })}>
            <FileTextIcon /> {t("home.previewCv")}
          </Link>
        </div>
      </div>

      <div className={cn("mx-5 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm", status.className)}>
        <status.icon className="size-4 shrink-0" />
        {status.text}
        {visible && !missing.length && <EyeIcon className="ms-auto size-4 shrink-0 opacity-60" />}
      </div>

      {talent?.summary && <p className="px-5 pt-4 text-sm leading-relaxed whitespace-pre-line">{talent.summary}</p>}

      <dl className="grid grid-cols-2 gap-5 p-5 text-sm">
        <div className="min-w-0">
          <dt className="mb-1 text-xs text-muted-foreground">{t("home.latestJob")}</dt>
          <dd>
            {latest ? (
              <>
                <div className="truncate font-medium">{latest.title}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {latest.employer}
                  {formatJobPeriod(latest) && <span dir="ltr"> · {formatJobPeriod(latest)}</span>}
                </div>
              </>
            ) : (
              <span className="text-muted-foreground">{t("home.noExperience")}</span>
            )}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="mb-1 text-xs text-muted-foreground">{t("home.skills")}</dt>
          <dd>
            {skills.length ? (
              <ul className="flex flex-wrap gap-1.5">
                {skills.slice(0, 10).map((s) => (
                  <li key={s} className="rounded-full border bg-muted/50 px-2 py-0.5 text-xs">
                    {s}
                  </li>
                ))}
                {skills.length > 10 && <li className="px-1 text-xs text-muted-foreground">+{skills.length - 10}</li>}
              </ul>
            ) : (
              <Link href="/profile" className="text-primary hover:underline">
                {t("home.noSkills")}
              </Link>
            )}
          </dd>
        </div>
      </dl>
    </section>
  )
}
