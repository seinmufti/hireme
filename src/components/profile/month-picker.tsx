"use client"

import { useState } from "react"
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const MONTH_VALUE = /^\d{4}-\d{2}$/
const pad = (n: number) => String(n).padStart(2, "0")
const label = (value: string) => {
  const [y, m] = value.split("-").map(Number)
  return `${MONTHS[m - 1]} ${y}`
}

/** True when both dates are complete and the end is before the start. */
export const endsBeforeStart = (start: string, end: string) => MONTH_VALUE.test(start) && MONTH_VALUE.test(end) && end < start

/**
 * One field for a month and year ("YYYY-MM"): a popup with the year (arrows) and its twelve months.
 * Months before `min` or after `max` (e.g. the other end of a period) can't be picked.
 */
export function MonthPicker({
  value,
  onChange,
  min = "",
  max = "",
  placeholder = "Month and year",
  invalid,
  clearable,
}: {
  value: string
  onChange: (v: string) => void
  min?: string
  max?: string
  placeholder?: string
  invalid?: boolean
  clearable?: boolean
}) {
  const thisYear = new Date().getFullYear()
  const first = Math.max(thisYear - 60, MONTH_VALUE.test(min) ? Number(min.slice(0, 4)) : 0)
  const last = Math.min(thisYear + 10, MONTH_VALUE.test(max) ? Number(max.slice(0, 4)) : Infinity)
  const set = MONTH_VALUE.test(value)
  const startYear = () => (set ? Number(value.slice(0, 4)) : Math.min(Math.max(thisYear, first), last))

  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(startYear)
  const disabled = (m: number) => {
    const key = `${year}-${pad(m)}`
    return (MONTH_VALUE.test(min) && key < min) || (MONTH_VALUE.test(max) && key > max)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setYear(startYear())
      }}
    >
      <PopoverTrigger
        render={
          <button
            type="button"
            data-invalid={invalid || undefined}
            className="flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-transparent pr-2 pl-2.5 text-left text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20"
          />
        }
      >
        <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className={cn("flex-1 truncate", !set && "text-muted-foreground")}>{set ? label(value) : placeholder}</span>
        {clearable && set && (
          <span
            role="button"
            tabIndex={-1}
            aria-label="Clear"
            onClick={(e) => {
              e.stopPropagation()
              onChange("")
            }}
            className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <XIcon className="size-3.5" />
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 gap-2 p-2">
        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Previous year" disabled={year <= first} onClick={() => setYear(year - 1)}>
            <ChevronLeftIcon />
          </Button>
          <span className="text-sm font-medium tabular-nums">{year}</span>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Next year" disabled={year >= last} onClick={() => setYear(year + 1)}>
            <ChevronRightIcon />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {MONTHS.map((m, i) => {
            const key = `${year}-${pad(i + 1)}`
            return (
              <button
                key={m}
                type="button"
                disabled={disabled(i + 1)}
                onClick={() => {
                  onChange(key)
                  setOpen(false)
                }}
                className={cn(
                  "rounded-md py-1.5 text-sm hover:bg-muted disabled:pointer-events-none disabled:opacity-35",
                  key === value && "bg-primary text-primary-foreground hover:bg-primary"
                )}
              >
                {m}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Start and end month side by side. Without an end it is ongoing; `current` shows "Present" instead of the
 * end picker (jobs). The end can't be picked before the start, nor the start after the end.
 */
export function PeriodPicker({
  start,
  end,
  onChange,
  current,
  endPlaceholder = "End",
  what = "It",
}: {
  start: string
  end: string
  onChange: (patch: { start?: string; end?: string }) => void
  current?: boolean
  endPlaceholder?: string
  what?: string
}) {
  const wrong = !current && endsBeforeStart(start, end)
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <MonthPicker value={start} onChange={(v) => onChange({ start: v })} max={current ? "" : end} placeholder="Start" />
        <span className="text-muted-foreground">–</span>
        {current ? (
          <div className="flex h-9 items-center rounded-lg border border-dashed px-2.5 text-sm text-muted-foreground">Present</div>
        ) : (
          <MonthPicker value={end} onChange={(v) => onChange({ end: v })} min={start} placeholder={endPlaceholder} invalid={wrong} clearable />
        )}
      </div>
      {wrong && <p className="text-xs font-medium text-destructive">{what} can&apos;t end before it starts.</p>}
    </div>
  )
}
