"use client"

import { CrownIcon, MessageCircleIcon, PhoneIcon } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useT } from "@/i18n/provider"

/** Who to contact to get HireMe Premium (there's no online payment yet). */
export const PREMIUM_PHONE = "+964 750 131 4159"
const digits = PREMIUM_PHONE.replace(/\D/g, "")

/** Getting Premium: call or message HireMe. */
export function PremiumContactDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CrownIcon className="size-5 fill-amber-300 text-amber-500" /> {t("premium.contactTitle")}
          </DialogTitle>
          <DialogDescription>{t("premium.contactBody")}</DialogDescription>
        </DialogHeader>
        <p dir="ltr" className="text-center text-xl font-semibold tracking-wide tabular-nums">
          {PREMIUM_PHONE}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <a href={`tel:+${digits}`} className={buttonVariants({ variant: "outline" })}>
            <PhoneIcon /> {t("premium.call")}
          </a>
          <a href={`https://wa.me/${digits}`} target="_blank" rel="noreferrer" className={buttonVariants()}>
            <MessageCircleIcon /> {t("premium.whatsapp")}
          </a>
        </div>
      </DialogContent>
    </Dialog>
  )
}
