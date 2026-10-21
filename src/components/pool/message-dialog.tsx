"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RotateCcwIcon, SendIcon } from "lucide-react"
import { toast } from "sonner"
import { useStore } from "@/lib/store"
import { UserAvatar } from "@/components/user-avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import type { PoolTalent } from "@/lib/filters"
import { latestJob } from "./talent-meta"
import { useT } from "@/i18n/provider"

export type Sender = { name: string; title: string; company: string }

export function messageTemplate(talent: PoolTalent, from: Sender) {
  const role = [from.title, from.company].filter(Boolean).join(" at ")
  const background = talent.experiences[0] ? `your background as a ${talent.experiences[0].title}` : "your CV"
  return `Hi ${talent.firstName},

I'm ${from.name}${role ? `, ${role}` : ""}. I came across your profile on HireMe and was impressed by ${background}.

We have an opening that looks like a strong match for your experience, and I'd love to tell you more about it. Would you be available for a short call this week?

Best regards,
${from.name}${from.company ? `\n${from.company}` : ""}`
}

export function MessageDialog({
  talent,
  sender,
  open,
  onOpenChange,
  jobId,
}: {
  talent: PoolTalent | null
  sender: Sender
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Messaging an applicant: the job they applied to (shown in the inbox) */
  jobId?: string
}) {
  const t = useT()
  const router = useRouter()
  const [body, setBody] = useState("")
  const sendMessage = useStore((s) => s.sendMessage)
  const [loadedFor, setLoadedFor] = useState<string | null>(null)

  // Reset to the template whenever the dialog opens for a new person
  if (open && talent && loadedFor !== talent.id) {
    setLoadedFor(talent.id)
    setBody(messageTemplate(talent, sender))
  }
  if (!open && loadedFor !== null) setLoadedFor(null)

  if (!talent) return null

  const submit = () => {
    const res = sendMessage(talent.userId, body, jobId)
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    onOpenChange(false)
    toast.success(t("pool.messageSent", { name: talent.firstName }), {
      action: { label: t("pool.openThread"), onClick: () => router.push(`/inbox/${res.conversationId}`) },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("pool.messageTitle", { name: talent.firstName })}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
          <UserAvatar name={talent.firstName} color={talent.avatarColor} size={36} />
          <div className="min-w-0 text-sm">
            <div className="font-medium">{talent.firstName}</div>
            <div className="truncate text-muted-foreground">{latestJob(talent.experiences)}</div>
          </div>
        </div>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
          className="min-h-64 resize-y text-sm leading-relaxed"
          autoFocus
        />
        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={() => setBody(messageTemplate(talent, sender))}>
            <RotateCcwIcon /> {t("pool.resetTemplate")}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={submit} disabled={!body.trim()}>
              <SendIcon /> {t("pool.sendMessage")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
