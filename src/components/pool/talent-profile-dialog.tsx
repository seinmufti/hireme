"use client"

import Link from "next/link"
import { MessageSquareTextIcon, SendIcon } from "lucide-react"
import { UserAvatar } from "@/components/user-avatar"
import { Button, buttonVariants } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { PoolTalent } from "@/lib/filters"
import { timeAgo } from "@/lib/format"
import { CertificationList, DegreeList, ExperienceList, LanguageList, latestJob, portfolioFacts } from "./talent-meta"

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
  if (!talent) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="flex-row items-center gap-4">
          <UserAvatar name={talent.firstName} color={talent.avatarColor} size={56} />
          <div className="space-y-1">
            <DialogTitle className="text-lg">{talent.firstName}</DialogTitle>
            <DialogDescription>{latestJob(talent.experiences)}</DialogDescription>
          </div>
        </DialogHeader>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border bg-muted/30 p-4 text-sm">
          {portfolioFacts(talent)
            // Languages get their own table below
            .filter((f) => f.label !== "Languages")
            .map((f) => (
            <div key={f.label} className="flex items-start gap-2.5">
              <f.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div>
                <dt className="text-xs text-muted-foreground">{f.label}</dt>
                <dd className="font-medium">{f.value}</dd>
              </div>
            </div>
          ))}
        </dl>

        <div>
          <h4 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Languages</h4>
          <LanguageList languages={talent.languages} />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Education</h4>
            <DegreeList degrees={talent.degrees} />
          </div>
          <div>
            <h4 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Certifications</h4>
            <CertificationList certifications={talent.certifications} />
          </div>
        </div>

        <div>
          <h4 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Previous jobs</h4>
          <ExperienceList experiences={talent.experiences} />
        </div>

        <DialogFooter className="items-center sm:justify-between">
          <span className="text-xs text-muted-foreground">Updated {timeAgo(talent.updatedAt)}</span>
          {canMessage &&
            (talent.conversationId ? (
              <Link href={`/inbox/${talent.conversationId}`} className={buttonVariants({ variant: "outline" })}>
                <MessageSquareTextIcon /> Open conversation
              </Link>
            ) : (
              <Button onClick={onMessage}>
                <SendIcon /> Send message
              </Button>
            ))}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
