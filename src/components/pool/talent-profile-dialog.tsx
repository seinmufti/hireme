"use client"

import Link from "next/link"
import { MessageSquareTextIcon, SendIcon } from "lucide-react"
import { CvDocument } from "@/components/cv/cv-document"
import { Button, buttonVariants } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { PoolTalent } from "@/lib/filters"
import { useT, useTimeAgo } from "@/i18n/provider"
import { latestJob } from "./talent-meta"

/** A job seeker's CV as employers see it: no contact details, address or references, and no download. */
export function TalentProfileDialog({
  talent,
  open,
  onOpenChange,
  canMessage,
  onMessage,
}: {
  talent: PoolTalent | null
  open: boolean
  onOpenChange: (open: boolean) => void
  canMessage: boolean
  onMessage: () => void
}) {
  const t = useT()
  const timeAgo = useTimeAgo()
  if (!talent) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-x-hidden overflow-y-auto bg-muted p-0 sm:max-w-[calc(210mm+4rem)]">
        <DialogHeader className="sr-only">
          <DialogTitle>{talent.firstName}</DialogTitle>
          <DialogDescription>{talent.title || latestJob(talent.experiences)}</DialogDescription>
        </DialogHeader>

        <div className="p-6">
          <CvDocument
            person={{ ...talent, name: talent.firstName }}
            talent={talent}
            age={talent.age}
            forEmployer
            showAttachments
            className="shadow-sm"
          />
        </div>

        <DialogFooter className="sticky bottom-0 m-0 items-center rounded-none border-t bg-card/95 px-6 py-3 backdrop-blur sm:justify-between">
          <span className="text-xs text-muted-foreground">{t("common.updated", { time: timeAgo(talent.updatedAt) })}</span>
          {canMessage &&
            (talent.conversationId ? (
              <Link href={`/inbox/${talent.conversationId}`} className={buttonVariants({ variant: "outline" })}>
                <MessageSquareTextIcon /> {t("pool.openConversation")}
              </Link>
            ) : (
              <Button onClick={onMessage}>
                <SendIcon /> {t("pool.sendMessage")}
              </Button>
            ))}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
