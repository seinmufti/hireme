"use client"

import Link from "next/link"
import { MessageSquareTextIcon, SendIcon } from "lucide-react"
import { ProfilePhoto } from "@/components/cv/photo"
import { SaveTalentButton } from "@/components/save-button"
import { Button, buttonVariants } from "@/components/ui/button"
import type { PoolTalent } from "@/lib/filters"
import { timeAgo } from "@/lib/format"
import { useT, useExactDate } from "@/i18n/provider"
import { formatDuration, jobMonths } from "@/lib/format"
import { JobMatchTags } from "./job-match-tags"
import { latestJob, portfolioFacts } from "./talent-meta"

export function TalentCard({
  talent,
  canMessage,
  onOpen,
  onMessage,
}: {
  talent: PoolTalent
  canMessage: boolean
  onOpen: () => void
  onMessage: () => void
}) {
  const t = useT()
  const exact = useExactDate()
  const byField = [
    ...talent.experiences.reduce((all, e) => {
      const field = e.category?.trim()
      return field ? all.set(field, (all.get(field) ?? 0) + jobMonths(e)) : all
    }, new Map<string, number>()),
  ]
    .filter(([, m]) => m > 0)
    .sort((a, b) => b[1] - a[1])
  return (
    <article className="@container relative flex flex-col rounded-xl border bg-card p-5 shadow-xs transition hover:border-primary/30 hover:shadow-sm">
      <div className="flex items-start gap-3 pe-8">
        <button type="button" onClick={onOpen} className="flex min-w-32 flex-1 items-start gap-3 text-start">
          <ProfilePhoto photoId={talent.photoId} name={talent.firstName} color={talent.avatarColor} size={44} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold hover:underline">{talent.firstName}</h3>
            <p className="truncate text-sm text-muted-foreground">{talent.title || latestJob(talent.experiences)}</p>
          </div>
        </button>
        {/* Employers: how well they match each of the employer's open jobs */}
        <JobMatchTags talent={talent} className="min-w-0 shrink justify-end" />
      </div>
      <SaveTalentButton talentId={talent.id} className="absolute end-3 top-3" />

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {portfolioFacts(talent).map((f) => (
          <div key={f.label} className="flex min-w-0 items-center gap-2" title={f.label}>
            <f.icon className="size-3.5 shrink-0 text-muted-foreground" />
            <dt className="sr-only">{f.label}</dt>
            <dd className="truncate">{f.value}</dd>
          </div>
        ))}
      </dl>

      {/* Overall: their experience split by field, most first (as on their own Profile) */}
      <div className="mt-4 border-t pt-3">
        <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("home.overall")}</p>
        {byField.length ? (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 @lg:grid-cols-3">
            {byField.map(([field, months]) => (
              <li key={field} className="min-w-0 leading-snug">
                <p className="truncate text-sm font-medium">{field}</p>
                <p className="text-xs text-muted-foreground tabular-nums">{formatDuration(months)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{t("form.noJobsListed")}</p>
        )}
      </div>

      <div className="mt-auto flex items-center gap-2 pt-4">
        <span className="text-xs text-muted-foreground" title={exact(talent.updatedAt)}>{t("common.updated", { time: timeAgo(talent.updatedAt) })}</span>
        <Button variant="ghost" size="sm" className="ms-auto" onClick={onOpen}>{t("common.view")}</Button>
        {canMessage &&
          (talent.conversationId ? (
            <Link href={`/inbox/${talent.conversationId}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <MessageSquareTextIcon /> {t("pool.conversation")}
            </Link>
          ) : (
            <Button size="sm" onClick={onMessage}>
              <SendIcon /> {t("pool.sendMessage")}
            </Button>
          ))}
      </div>
    </article>
  )
}
