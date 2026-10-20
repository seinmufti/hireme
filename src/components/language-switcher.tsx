"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckIcon, LanguagesIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { dirFor, LOCALE_NAMES, LOCALES, saveLocale, type Locale } from "@/i18n/locales"
import { useI18n } from "@/i18n/provider"
import { cn } from "@/lib/utils"

/** Picks English, Arabic or Kurdish. Saved in a cookie for a year, so the server renders in that language. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, t } = useI18n()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const choose = (next: Locale) => {
    setOpen(false)
    if (next === locale) return
    saveLocale(next)
    // The server renders the page again in the new language and direction
    startTransition(() => router.refresh())
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={t("common.language")}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
              pending && "opacity-60",
              className
            )}
          />
        }
      >
        <LanguagesIcon className="size-3.5" />
        {LOCALE_NAMES[locale]}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-40 gap-0 p-1">
        {LOCALES.map((l) => (
          <button
            key={l}
            type="button"
            dir={dirFor(l)}
            lang={l}
            onClick={() => choose(l)}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-sm hover:bg-muted",
              l === locale && "font-semibold text-primary"
            )}
          >
            {LOCALE_NAMES[l]}
            {l === locale && <CheckIcon className="size-4" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
