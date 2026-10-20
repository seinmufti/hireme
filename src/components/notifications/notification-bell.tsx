"use client"

import { useState } from "react"
import { BellIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useT } from "@/i18n/provider"
import { unreadNotificationsFor, useStore } from "@/lib/store"
import { NotificationList } from "./notification-list"

/** A bell with the number of unread notifications; opens them in a dropdown panel on the right. */
export function NotificationBell() {
  const t = useT()
  const [open, setOpen] = useState(false)
  const unread = useStore((s) => (s.currentUserId ? unreadNotificationsFor(s, s.currentUserId) : 0))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={unread ? t("notifications.openWithCount", { count: unread }) : t("notifications.open")}
            className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground data-popup-open:bg-muted data-popup-open:text-foreground"
          />
        }
      >
        <BellIcon className="size-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -end-0.5 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] leading-4 font-semibold text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="max-h-[min(32rem,calc(100dvh-6rem))] w-96 gap-0 p-0">
        <NotificationList limit={5} onNavigate={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}
