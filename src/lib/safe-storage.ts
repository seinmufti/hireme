import type { StateStorage } from "zustand/middleware"

// The app's data lives in localStorage, shared by every tab of this site. Each tab saves its whole
// copy, so a tab holding older data could save over newer data and an account would vanish.
// This storage layer makes that impossible:
//  - saving never drops an item (account, portfolio, conversation, message, job, notification) that's already stored;
//    anything a tab is missing is put back, and a warning with a stack trace is logged
//  - the data can only be replaced on purpose, through replaceAllOnce (the reset button)
//  - the previous version is always kept as a backup, so even a reset can be undone

const BACKUP_KEY = "hireme-demo-backup"
const LISTS = ["users", "talents", "conversations", "messages", "jobs", "notifications"] as const

let replacing = false
let onRestored: (() => void) | null = null

/** Run a state change that is allowed to replace everything (reset, undo). */
export function replaceAllOnce(run: () => void) {
  replacing = true
  try {
    run()
  } finally {
    replacing = false
  }
}

/** Called after items were put back, so the tab that was missing them can reload its copy. */
export function setOnRestored(callback: () => void) {
  onRestored = callback
}

type Stored = { version?: number; state?: Record<string, unknown> }
type WithId = { id: string }

function backUp(previous: string) {
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify({ at: new Date().toISOString(), value: previous }))
  } catch {}
}

export const safeStorage: StateStorage = {
  getItem: (name) => (typeof window === "undefined" ? null : localStorage.getItem(name)),
  removeItem: (name) => {
    if (typeof window !== "undefined" && replacing) localStorage.removeItem(name)
  },
  setItem: (name, value) => {
    if (typeof window === "undefined") return
    const previous = localStorage.getItem(name)
    let next = value

    if (previous && previous !== value) {
      // Keep the previous version, at most every 20 seconds (always, when replacing on purpose)
      let lastBackup = 0
      try {
        lastBackup = new Date(JSON.parse(localStorage.getItem(BACKUP_KEY) ?? "null")?.at ?? 0).getTime()
      } catch {}
      if (replacing || Date.now() - lastBackup > 20_000) backUp(previous)

      if (!replacing) {
        try {
          const before: Stored = JSON.parse(previous)
          const after: Stored = JSON.parse(value)
          // Only merge data of the same shape; the app's migration deals with older versions
          if (before.state && after.state && before.version === after.version) {
            let restored = 0
            for (const key of LISTS) {
              const stored = (before.state[key] ?? []) as WithId[]
              const incoming = (after.state[key] ?? []) as WithId[]
              const have = new Set(incoming.map((item) => item.id))
              const missing = stored.filter((item) => !have.has(item.id))
              if (missing.length) {
                after.state[key] = [...incoming, ...missing]
                restored += missing.length
              }
            }
            if (restored) {
              console.warn(
                `[hireme] A save would have deleted ${restored} stored item(s). They were kept. Where it came from:`,
                new Error().stack
              )
              next = JSON.stringify(after)
              setTimeout(() => onRestored?.(), 0)
            }
          }
        } catch {}
      }
    }
    localStorage.setItem(name, next)
  },
}

/** When the data was last backed up, or null if there's no backup. */
export function backupInfo() {
  if (typeof window === "undefined") return null
  try {
    const backup = JSON.parse(localStorage.getItem(BACKUP_KEY) ?? "null")
    return backup?.value ? { at: backup.at as string } : null
  } catch {
    return null
  }
}

/** Put the backed-up version back. Returns false if there is none. */
export function restoreBackup(name: string) {
  try {
    const backup = JSON.parse(localStorage.getItem(BACKUP_KEY) ?? "null")
    if (!backup?.value) return false
    replaceAllOnce(() => localStorage.setItem(name, backup.value))
    return true
  } catch {
    return false
  }
}
