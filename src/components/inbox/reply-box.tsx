"use client"

import { useState } from "react"
import { SendIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useStore } from "@/lib/store"

export function ReplyBox({ conversationId, placeholder }: { conversationId: string; placeholder: string }) {
  const [body, setBody] = useState("")
  const replyMessage = useStore((s) => s.replyMessage)

  const send = () => {
    if (!body.trim()) return
    const res = replyMessage(conversationId, body)
    if (res.ok) setBody("")
    else toast.error(res.error)
  }

  return (
    <div className="flex items-end gap-3 border-t bg-card p-4">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            send()
          }
        }}
        rows={2}
        placeholder={placeholder}
        className="max-h-40 min-h-11 resize-none"
      />
      <Button onClick={send} disabled={!body.trim()} className="h-11 px-4">
        <SendIcon /> Send
      </Button>
    </div>
  )
}
