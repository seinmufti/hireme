"use client"

import { MessagesSquareIcon } from "lucide-react"
import { useT } from "@/i18n/provider"

export default function InboxIndexPage() {
  const t = useT()
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
      <MessagesSquareIcon className="size-10" />
      <p className="text-sm">{t("inbox.select")}</p>
    </div>
  )
}
