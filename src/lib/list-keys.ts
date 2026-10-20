import type { KeyboardEvent } from "react"

// Keyboard navigation for the searchable dropdowns: the search box keeps focus while the arrow keys move
// a highlight through the options (any element marked data-option), and Enter picks the highlighted one,
// or the first one when nothing is highlighted. Used by every search-and-pick popover.

/** Class for an option button, so the highlighted one looks like a hovered one. */
export const OPTION_ACTIVE = "data-[active=true]:bg-muted"

const optionsOf = (input: HTMLElement) => [...(input.closest("[data-slot=popover-content]")?.querySelectorAll<HTMLElement>("[data-option]") ?? [])]

/** Clears the highlight; call when the search text changes, since the options change too. */
export function resetActiveOption(input: HTMLElement) {
  for (const o of optionsOf(input)) delete o.dataset.active
}

/** Handles ArrowUp, ArrowDown and Enter in the search box. Returns true when it handled the key. */
export function handleListKeys(e: KeyboardEvent<HTMLInputElement>) {
  if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Enter") return false
  const options = optionsOf(e.currentTarget)
  const current = options.findIndex((o) => o.dataset.active === "true")

  if (e.key === "Enter") {
    const target = options[current] ?? options[0]
    if (!target) return false
    e.preventDefault()
    target.click()
    return true
  }

  if (!options.length) return false
  e.preventDefault()
  const next = e.key === "ArrowDown" ? (current + 1) % options.length : (current <= 0 ? options.length : current) - 1
  for (const o of options) delete o.dataset.active
  options[next].dataset.active = "true"
  options[next].scrollIntoView({ block: "nearest" })
  return true
}
