"use client"

import { createContext, useContext, useMemo } from "react"
import { timeAgo } from "@/lib/format"
import type { JobLocation } from "@/lib/types"
import { dirFor, type Locale } from "./locales"
import { translator, type Translate } from "./translate"

type I18n = { locale: Locale; dir: "ltr" | "rtl"; t: Translate }

const I18nContext = createContext<I18n | null>(null)

/** Set once in the root layout from the language cookie. */
export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const value = useMemo(() => ({ locale, dir: dirFor(locale), t: translator(locale) }), [locale])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

/** The current language, its direction and t() for looking up text. */
export function useI18n() {
  const value = useContext(I18nContext)
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>")
  return value
}

export const useT = () => useI18n().t

/**
 * timeAgo() in the current language: "5d ago" in English (as before), "قبل ٥ أيام" in Arabic and so on.
 * Uses the browser's own translations, so no dictionary entries are needed.
 */
export function useTimeAgo() {
  const { locale } = useI18n()
  return useMemo(() => {
    if (locale === "en") return timeAgo
    const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" })
    return (date: Date | string) => {
      const s = Math.round((new Date(date).getTime() - Date.now()) / 1000)
      const abs = Math.abs(s)
      if (abs < 60) return format.format(0, "second")
      if (abs < 3600) return format.format(Math.round(s / 60), "minute")
      if (abs < 86400) return format.format(Math.round(s / 3600), "hour")
      if (abs < 86400 * 30) return format.format(Math.round(s / 86400), "day")
      return new Date(date).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })
    }
  }, [locale])
}

/** A job's location in the current language: the city as written, or "Remote" / "International". */
export function useLocationLabel() {
  const t = useT()
  return (l: JobLocation) => (l.remote ? t("jobs.remote") : l.international ? t("jobs.international") : l.iraqCity || t("jobs.iraq"))
}
