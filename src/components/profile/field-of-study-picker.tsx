"use client"

import { useState } from "react"
import { CheckIcon, ChevronDownIcon, ListIcon, PencilLineIcon, SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { FIELD_GROUPS, FIELDS_OF_STUDY } from "@/lib/options"
import { cn } from "@/lib/utils"

/**
 * Field of study: search a grouped list, or choose "Other" and write your own.
 * Value is the field's name, either from the list or typed.
 */
export function FieldOfStudyPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [writing, setWriting] = useState(() => !!value && !FIELDS_OF_STUDY.includes(value))

  if (writing) {
    return (
      <div className="flex gap-1.5">
        <Input className="h-9" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Write your field" autoFocus />
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          title="Choose from the list"
          aria-label="Choose from the list"
          onClick={() => {
            setWriting(false)
            onChange("")
          }}
        >
          <ListIcon />
        </Button>
      </div>
    )
  }

  const q = query.trim().toLowerCase()
  const groups = Object.entries(FIELD_GROUPS)
    .map(([group, fields]) => [group, fields.filter((f) => !q || f.toLowerCase().includes(q))] as const)
    .filter(([, fields]) => fields.length > 0)

  const pick = (field: string) => {
    onChange(field)
    setOpen(false)
  }

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
            className="flex h-9 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent pr-2 pl-2.5 text-left text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        }
      >
        <span className={cn("truncate", !value && "text-muted-foreground")}>{value || "Choose"}</span>
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" collisionAvoidance={{ fallbackAxisSide: "none" }} className="w-80 gap-0 p-0">
        <div className="flex items-center gap-2 border-b px-3">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search fields, e.g. biology"
            className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoFocus
          />
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          {groups.length === 0 && <p className="px-3 py-4 text-center text-sm text-muted-foreground">No match. Use &quot;Other&quot; to write it.</p>}
          {groups.map(([group, fields]) => (
            <div key={group} className="mb-1">
              <p className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground">{group}</p>
              {fields.map((field) => (
                <button
                  key={field}
                  type="button"
                  onClick={() => pick(field)}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                >
                  {field}
                  {field === value && <CheckIcon className="size-4 text-primary" />}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="border-t p-1">
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              setWriting(true)
              onChange(query.trim())
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
          >
            <PencilLineIcon className="size-4 text-muted-foreground" />
            {q ? <>Other: write &ldquo;{query.trim()}&rdquo;</> : "Other (write your own)"}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
