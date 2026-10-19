import { MessagesSquareIcon } from "lucide-react"

export default function InboxIndexPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
      <MessagesSquareIcon className="size-10" />
      <p className="text-sm">Select a conversation</p>
    </div>
  )
}
