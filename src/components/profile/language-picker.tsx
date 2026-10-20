"use client"

import { useState } from "react"
import { CheckIcon, ChevronDownIcon, SearchIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { IRAQI_LANGUAGES, LANGUAGES, MAIN_LANGUAGES } from "@/lib/options"
import { handleListKeys, OPTION_ACTIVE, resetActiveOption } from "@/lib/list-keys"
import { cn } from "@/lib/utils"

/**
 * Searchable language dropdown. When `autoOpen` is set (a row was just added) it opens right away
 * so the language can be searched for immediately.
 */
export function LanguagePicker({
  value,
  taken,
  autoOpen = false,
  onChange,
}: {
  value: string
  /** Languages already listed in other rows */
  taken: string[]
  autoOpen?: boolean
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(autoOpen)
  const [query, setQuery] = useState("")

  const q = query.trim().toLowerCase()
  const available = LANGUAGES.filter((l) => l === value || !taken.includes(l))
  const matches = available.filter((l) => !q || l.toLowerCase().includes(q))
  // The main languages come first, then the languages of Iraq, then the rest. Enter picks the first one shown.
  const main = MAIN_LANGUAGES.filter((l) => matches.includes(l))
  const iraqi = matches.filter((l) => IRAQI_LANGUAGES.includes(l) && !main.includes(l))
  const others = matches.filter((l) => !IRAQI_LANGUAGES.includes(l) && !main.includes(l))
  const groups = [
    ["Main languages", main],
    ["Languages of Iraq", iraqi],
    ["Other languages", others],
  ] as const

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setQuery("")
      }}
    >
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={value ? `Language: ${value}` : "Choose a language"}
            className="flex h-9 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent pr-2 pl-2.5 text-left text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        }
      >
        <span className={cn("truncate", !value && "text-muted-foreground")}>{value || "Choose language"}</span>
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" collisionAvoidance={{ fallbackAxisSide: "none" }} className="w-72 gap-0 p-0">
        <div className="flex items-center gap-2 border-b px-3">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              resetActiveOption(e.currentTarget)
            }}
            onKeyDown={handleListKeys}
            placeholder="Search languages"
            className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoFocus
          />
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          {matches.length === 0 && <p className="px-3 py-4 text-center text-sm text-muted-foreground">No language found.</p>}
          {groups.map(
            ([title, list]) =>
              list.length > 0 && (
                <div key={title} className="mb-1">
                  <p className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground">{title}</p>
                  {list.map((language) => (
                    <button
                      key={language}
                      type="button"
                      onClick={() => {
                        onChange(language)
                        setOpen(false)
                      }}
                      data-option
                      className={cn("flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted", OPTION_ACTIVE)}
                    >
                      {language}
                      {language === value && <CheckIcon className="size-4 text-primary" />}
                    </button>
                  ))}
                </div>
              )
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
