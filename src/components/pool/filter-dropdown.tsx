"use client"

import { useT } from "@/i18n/provider"
import { useState } from "react"
import { CheckIcon, ChevronDownIcon, ChevronRightIcon, SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { FilterDef } from "@/lib/filters"
import { handleListKeys, OPTION_ACTIVE, resetActiveOption } from "@/lib/list-keys"
import { cn } from "@/lib/utils"

function OptionRow({
  label,
  isOn,
  count,
  chevron,
  highlighted,
  onClick,
  onHover,
}: {
  label: string
  isOn: boolean
  count: number
  chevron?: boolean
  highlighted?: boolean
  onClick: () => void
  onHover?: () => void
}) {
  return (
    <button
      type="button"
      role="option"
      data-option
      aria-selected={isOn}
      onClick={onClick}
      onMouseEnter={onHover}
      onFocus={onHover}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-start text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
        OPTION_ACTIVE,
        highlighted && "bg-muted",
        count === 0 && !isOn && "text-muted-foreground/60"
      )}
    >
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-[4px] border",
          isOn ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background"
        )}
      >
        {isOn && <CheckIcon className="size-3" />}
      </span>
      <span className="flex-1 truncate">{label}</span>
      <span
        className={cn(
          "min-w-7 rounded-full px-1.5 text-center text-xs tabular-nums",
          count > 0 ? "bg-muted font-medium text-foreground" : "text-muted-foreground/60"
        )}
      >
        {count}
      </span>
      {chevron && <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground" />}
    </button>
  )
}

/** ArrowUp and ArrowDown move focus to the previous or next option when focus is on an option. */
function focusRowWithArrows(e: React.KeyboardEvent<HTMLElement>) {
  if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return
  const rows = [...e.currentTarget.querySelectorAll<HTMLElement>("[data-option]")]
  const at = rows.indexOf(e.target as HTMLElement)
  if (at < 0) return
  e.preventDefault()
  rows[(at + (e.key === "ArrowDown" ? 1 : rows.length - 1)) % rows.length].focus()
}

export function FilterDropdown({
  def,
  selected,
  counts,
  onChange,
  countLabel,
}: {
  // Only what the dropdown shows, so other lists (e.g. job search) can use it too
  def: Pick<FilterDef, "label" | "mode" | "options" | "children" | "pinned"> & { key?: string }
  selected: string[]
  counts: Map<string, number>
  onChange: (values: string[]) => void
  countLabel?: string
}) {
  const t = useT()
  // Filters added later without a translation keep their English label
  const label = t.dynamic(`pool.filters.${def.key}`, def.label)
  const [query, setQuery] = useState("")
  // The option whose sub-choices (e.g. fields of study) are showing beside the list
  const [hovered, setHovered] = useState<string | null>(null)
  const searchable = def.options.length > 10
  const visible = def.options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
  // Pinned options (e.g. the main languages) get their own section above the rest
  const pinned = def.pinned ? def.pinned.values.flatMap((v) => visible.filter((o) => o.value === v)) : []
  const rest = visible.filter((o) => !pinned.includes(o))
  const sections: [string, typeof visible][] = def.pinned
    ? [
        [def.pinned.title, pinned],
        [t("pool.allOf", { label }), rest],
      ]
    : [["", visible]]
  const children = hovered ? (def.children?.[hovered] ?? []) : []

  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])

  return (
    <Popover
      onOpenChange={(open) => {
        if (!open) {
          setQuery("")
          setHovered(null)
        }
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn("h-8", selected.length > 0 && "border-primary/50 bg-brand-soft text-primary hover:bg-brand-soft")}
          />
        }
      >
        {label}
        {selected.length > 0 && (
          <span className="rounded-full bg-primary px-1.5 text-[10px] leading-4 font-semibold text-primary-foreground">
            {selected.length}
          </span>
        )}
        <ChevronDownIcon className="text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto gap-0 p-0" onMouseLeave={() => setHovered(null)}>
        <div className="flex">
          <div className="w-72 shrink-0">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="text-xs font-medium text-muted-foreground">
                {def.mode === "all" ? t("pool.filterAll") : t("pool.filterAny")}
              </span>
              <span className="text-xs text-muted-foreground">{countLabel ?? t("pool.candidates")}</span>
            </div>
            {searchable && (
              <div className="flex items-center gap-2 border-b px-3">
                <SearchIcon className="size-3.5 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    resetActiveOption(e.currentTarget)
                  }}
                  onKeyDown={handleListKeys}
                  placeholder={t("pool.searchIn", { label })}
                  className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            )}
            <div className="max-h-[min(18rem,calc(var(--available-height)-4.5rem))] overflow-y-auto p-1" role="listbox" aria-multiselectable onKeyDown={focusRowWithArrows}>
              {visible.length === 0 && <p className="px-2 py-4 text-center text-sm text-muted-foreground">{t("pool.noOptions")}</p>}
              {sections.filter(([, list]) => list.length > 0).map(([title, list]) => (
                <div key={title}>
                  {title && <p className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground">{title}</p>}
                  {list.map((opt) => {
                    const hasChildren = (def.children?.[opt.value]?.length ?? 0) > 0
                    return (
                      <OptionRow
                        key={opt.value}
                        label={opt.label}
                        isOn={selected.includes(opt.value)}
                        count={counts.get(opt.value) ?? 0}
                        chevron={hasChildren}
                        highlighted={hovered === opt.value}
                        onClick={() => toggle(opt.value)}
                        onHover={() => setHovered(hasChildren ? opt.value : null)}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {children.length > 0 && (
            <div className="w-64 shrink-0 border-l">
              <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">{hovered}: choose a field</div>
              <div className="max-h-[min(18rem,calc(var(--available-height)-4.5rem))] overflow-y-auto p-1" role="listbox" aria-multiselectable onKeyDown={focusRowWithArrows}>
                {children.map((child) => (
                  <OptionRow
                    key={child.value}
                    label={child.label}
                    isOn={selected.includes(child.value)}
                    count={counts.get(child.value) ?? 0}
                    onClick={() => toggle(child.value)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        {selected.length > 0 && (
          <div className="border-t p-1">
            <Button variant="ghost" size="sm" className="w-full" onClick={() => onChange([])}>
              {t("pool.clearFilter", { label })}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
