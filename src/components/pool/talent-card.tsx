"use client"

import Link from "next/link"
import { MessageSquareTextIcon, SendIcon } from "lucide-react"
import { ProfilePhoto } from "@/components/cv/photo"
import { SaveTalentButton } from "@/components/save-button"
import { Button, buttonVariants } from "@/components/ui/button"
import type { PoolTalent } from "@/lib/filters"
import { timeAgo } from "@/lib/format"
import { useT } from "@/i18n/provider"
import { ExperienceList, latestJob, portfolioFacts } from "./talent-meta"

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
  return (
    <article className="relative flex flex-col rounded-xl border bg-card p-5 shadow-xs transition hover:border-primary/30 hover:shadow-sm">
      <button type="button" onClick={onOpen} className="flex items-start gap-3 pe-8 text-start">
        <ProfilePhoto photoId={talent.photoId} name={talent.firstName} color={talent.avatarColor} size={44} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold hover:underline">{talent.firstName}</h3>
          <p className="truncate text-sm text-muted-foreground">{talent.title || latestJob(talent.experiences)}</p>
        </div>
      </button>
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

      <div className="mt-4 border-t pt-3">
        <ExperienceList experiences={talent.experiences} limit={2} />
      </div>

      <div className="mt-auto flex items-center gap-2 pt-4">
        <span className="text-xs text-muted-foreground">{t("common.updated", { time: timeAgo(talent.updatedAt) })}</span>
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
