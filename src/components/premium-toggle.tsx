"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { CrownIcon } from "lucide-react"
import { toast } from "sonner"
import { useT } from "@/i18n/provider"
import { useIsPremium, usePremiumStore } from "@/lib/premium"
import type { User } from "@/lib/types"
import { cn } from "@/lib/utils"

/** Demo switch for job seekers: see the app with and without Premium (CV watermark, downloads). */
export function PremiumToggle({ user }: { user: User }) {
  const t = useT()
  const premium = useIsPremium(user)
  const setPremium = usePremiumStore((s) => s.setPremium)

  return (
    <label
      title={t("premium.hint")}
      className={cn(
        "flex h-8 cursor-pointer items-center gap-2 rounded-full border px-2.5 text-xs font-medium transition",
        premium ? "border-amber-300 bg-amber-50 text-amber-900" : "text-muted-foreground hover:bg-muted"
      )}
    >
      <CrownIcon className={cn("size-3.5", premium && "text-amber-600")} />
      {t("premium.label")}
      <SwitchPrimitive.Root
        checked={premium}
        aria-label={t("premium.label")}
        onCheckedChange={(on) => {
          setPremium(user.id, on)
          toast.success(on ? t("premium.on") : t("premium.off"))
        }}
        className="relative inline-flex h-4 w-7 shrink-0 items-center rounded-full bg-input transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-checked:bg-amber-500"
      >
        <SwitchPrimitive.Thumb className="block size-3 translate-x-0.5 rounded-full bg-background shadow-sm transition-transform data-checked:translate-x-3.5 rtl:-translate-x-0.5 rtl:data-checked:-translate-x-3.5" />
      </SwitchPrimitive.Root>
    </label>
  )
}
