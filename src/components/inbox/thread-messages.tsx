"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { useT } from "@/i18n/provider"

type Msg = { id: string; body: string; mine: boolean; at: string; read: boolean }

const time = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })

export function ThreadMessages({ messages }: { messages: Msg[] }) {
  const t = useT()
  const end = useRef<HTMLDivElement>(null)
  const lastId = messages.at(-1)?.id

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" })
  }, [lastId])

  return (
    <div className="flex-1 space-y-4 overflow-y-auto bg-muted/30 px-6 py-6">
      {messages.map((m) => (
        <div key={m.id} className={cn("flex flex-col", m.mine ? "items-end" : "items-start")}>
          <div
            className={cn(
              "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-xs",
              m.mine ? "rounded-ee-sm bg-primary text-primary-foreground" : "rounded-es-sm border bg-card"
            )}
          >
            {m.body}
          </div>
          <span className="mt-1 px-1 text-[11px] text-muted-foreground">
            {time(m.at)}
            {m.mine && ` · ${m.read ? t("inbox.seen") : t("inbox.sent")}`}
          </span>
        </div>
      ))}
      <div ref={end} />
    </div>
  )
}
