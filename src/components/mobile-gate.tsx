"use client"

import { MonitorIcon } from "lucide-react"
import { Logo } from "@/components/logo"
import { useT } from "@/i18n/provider"

export function MobileGate({ className }: { className?: string }) {
  const t = useT()
  return (
    <div className={className}>
      <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background px-6 text-center">
        <Logo size={72} />
        <MonitorIcon className="size-10 text-primary" />
        <h1 className="text-2xl font-semibold">{t("mobile.title")}</h1>
        <p className="max-w-xs text-sm text-muted-foreground">{t("mobile.body")}</p>
      </div>
    </div>
  )
}
