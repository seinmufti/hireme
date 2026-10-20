"use client"

import { useState } from "react"
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useMonthNames, useT, useWeekdayNames } from "@/i18n/provider"
import { cn } from "@/lib/utils"

const YEARS_PER_PAGE = 16
// Job seekers are 16 to 80 years old
const MIN_AGE = 16
const MAX_AGE = 80

const pad = (n: number) => String(n).padStart(2, "0")

type Step = "year" | "month" | "day"

/**
 * Date of birth in one calendar popup: pick the year, then the month, then the day.
 * Value is "YYYY-MM-DD" (or "" when empty).
 */
export function DateOfBirthPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useT()
  const months = useMonthNames("long")
  const shortMonths = useMonthNames("short")
  const weekdays = useWeekdayNames()
  const thisYear = new Date().getFullYear()
  const latest = thisYear - MIN_AGE
  const earliest = thisYear - MAX_AGE
  const [selY, selM, selD] = value ? value.split("-").map(Number) : [0, 0, 0]

  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("year")
  const [year, setYear] = useState(selY || latest - 9)
  const [month, setMonth] = useState(selM ? selM - 1 : 0)
  // First year shown on the current page of the year grid
  const [pageStart, setPageStart] = useState(() => latest - YEARS_PER_PAGE + 1)

  const openPicker = (next: boolean) => {
    setOpen(next)
    if (!next) return
    // Always start from the year, on the page that holds the chosen (or a typical) year
    const y = selY || latest - 9
    setStep("year")
    setYear(y)
    setMonth(selM ? selM - 1 : 0)
    setPageStart(Math.max(earliest, Math.min(latest - YEARS_PER_PAGE + 1, y - (YEARS_PER_PAGE - 4))))
  }

  const label = value
    ? new Date(selY, selM - 1, selD).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : ""

  const years = Array.from({ length: YEARS_PER_PAGE }, (_, i) => pageStart + i).filter((y) => y >= earliest && y <= latest)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = new Date(year, month, 1).getDay()

  const cell = (selected: boolean) =>
    cn(
      "rounded-md py-2 text-sm transition-colors hover:bg-muted",
      selected && "bg-primary font-medium text-primary-foreground hover:bg-primary"
    )

  const header = (title: React.ReactNode, onPrev?: () => void, onNext?: () => void, prevDisabled = false, nextDisabled = false) => (
    <div className="mb-2 flex items-center justify-between">
      <Button type="button" variant="ghost" size="icon-sm" aria-label={t("form.previous")} onClick={onPrev} disabled={!onPrev || prevDisabled} className={cn(!onPrev && "invisible")}>
        <ChevronLeftIcon />
      </Button>
      <div className="text-sm font-medium">{title}</div>
      <Button type="button" variant="ghost" size="icon-sm" aria-label={t("form.next")} onClick={onNext} disabled={!onNext || nextDisabled} className={cn(!onNext && "invisible")}>
        <ChevronRightIcon />
      </Button>
    </div>
  )

  return (
    <Popover open={open} onOpenChange={openPicker}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="flex h-9 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent pr-2 pl-2.5 text-left text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        }
      >
        <span className={cn(!label && "text-muted-foreground")}>{label || t("form.choose")}</span>
        <ChevronDownIcon className="size-4 text-muted-foreground" />
      </PopoverTrigger>
      {/* Stay above or below the field (never beside it), at the same height for every step */}
      <PopoverContent align="start" collisionAvoidance={{ fallbackAxisSide: "none" }} className="h-[19rem] w-72 justify-start p-3">
        {step === "year" && (
          <>
            {header(
              `${years[0]} – ${years.at(-1)}`,
              () => setPageStart((p) => p - YEARS_PER_PAGE),
              () => setPageStart((p) => p + YEARS_PER_PAGE),
              pageStart <= earliest,
              pageStart + YEARS_PER_PAGE > latest
            )}
            <p className="mb-2 text-xs text-muted-foreground">{t("form.chooseBirthYear")}</p>
            <div className="grid grid-cols-4 gap-1">
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  className={cell(y === selY)}
                  onClick={() => {
                    setYear(y)
                    setStep("month")
                  }}
                >
                  {y}
                </button>
              ))}
            </div>
          </>
        )}

        {step === "month" && (
          <>
            {header(
              <button type="button" className="rounded-md px-2 py-0.5 hover:bg-muted" onClick={() => setStep("year")}>
                {year}
              </button>
            )}
            <p className="mb-2 text-xs text-muted-foreground">{t("form.chooseMonth")}</p>
            <div className="grid grid-cols-3 gap-1">
              {months.map((m, i) => (
                <button
                  key={m}
                  type="button"
                  className={cell(year === selY && i + 1 === selM)}
                  onClick={() => {
                    setMonth(i)
                    setStep("day")
                  }}
                >
                  {shortMonths[i]}
                </button>
              ))}
            </div>
          </>
        )}

        {step === "day" && (
          <>
            {header(
              <span className="flex items-center gap-1">
                <button type="button" className="rounded-md px-1.5 py-0.5 hover:bg-muted" onClick={() => setStep("month")}>
                  {months[month]}
                </button>
                <button type="button" className="rounded-md px-1.5 py-0.5 hover:bg-muted" onClick={() => setStep("year")}>
                  {year}
                </button>
              </span>
            )}
            <div className="grid grid-cols-7 gap-0.5 text-center">
              {weekdays.map((w) => (
                <span key={w} className="py-1 text-xs text-muted-foreground">{w}</span>
              ))}
              {Array.from({ length: firstWeekday }, (_, i) => (
                <span key={`blank-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                <button
                  key={d}
                  type="button"
                  className={cn(cell(year === selY && month + 1 === selM && d === selD), "py-1.5")}
                  onClick={() => {
                    onChange(`${year}-${pad(month + 1)}-${pad(d)}`)
                    setOpen(false)
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
