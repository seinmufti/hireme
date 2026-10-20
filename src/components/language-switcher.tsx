"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckIcon, ChevronDownIcon, LanguagesIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { dirFor, LOCALE_NAMES, LOCALES, saveLocale, type Locale } from "@/i18n/locales"
import { useI18n } from "@/i18n/provider"
import { cn } from "@/lib/utils"

/**
 * Picks English, Arabic or Kurdish. Saved in a cookie for a year, so the server renders in that language.
 * In the navbar it's just the icon; `wide` (the sign-in page) also shows the current language's name.
 */
export function LanguageSwitcher({ wide, className }: { wide?: boolean; className?: string }) {
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
            title={LOCALE_NAMES[locale]}
            className={cn(
              wide
                ? "flex h-9 items-center gap-2 rounded-full border bg-card px-3.5 text-sm font-medium transition hover:bg-muted data-popup-open:bg-muted"
                : // Just the icon, like the bell next to it; the language names are in the dropdown
                  "flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground data-popup-open:bg-muted data-popup-open:text-foreground",
              pending && "opacity-60",
              className
            )}
          />
        }
      >
        <LanguagesIcon className={wide ? "size-4 text-muted-foreground" : "size-5"} />
        {wide && (
          <>
            {LOCALE_NAMES[locale]}
            <ChevronDownIcon className="size-4 text-muted-foreground" />
          </>
        )}
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
