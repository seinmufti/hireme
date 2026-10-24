"use client"

import { CrownIcon } from "lucide-react"
import { toast } from "sonner"
import { useT } from "@/i18n/provider"
import { useIsPremium, usePremiumStore } from "@/lib/premium"
import type { User } from "@/lib/types"
import { cn } from "@/lib/utils"

/** Demo for job seekers (Dev tools only): a crown that turns Premium on (gold) and off (grey), to see both CV modes. */
export function PremiumToggle({ user }: { user: User }) {
  const t = useT()
  const premium = useIsPremium(user)
  const setPremium = usePremiumStore((s) => s.setPremium)

  return (
    <button
      type="button"
      aria-pressed={premium}
      aria-label={t("premium.label")}
      title={t("premium.hint")}
      onClick={() => {
        setPremium(user.id, !premium)
        // Gold when it turns on, grey when it turns off (like the crown)
        if (premium) toast(t("premium.off"), { icon: <CrownIcon className="size-4" />, style: { background: "#f3f4f6", color: "#4b5563", borderColor: "#d1d5db" } })
        else toast(t("premium.on"), { icon: <CrownIcon className="size-4 fill-amber-400" />, style: { background: "#fef3c7", color: "#92400e", borderColor: "#fcd34d" } })
      }}
      className={cn(
        "flex size-9 items-center justify-center rounded-full transition",
        // On the black Dev tools bar: a glowing gold crown when on, a dim one when off
        premium ? "bg-amber-400/20 text-amber-300 hover:bg-amber-400/30" : "text-white/40 hover:bg-white/10 hover:text-white/70"
      )}
    >
      <CrownIcon className={cn("size-5", premium && "fill-amber-300")} />
    </button>
  )
}
