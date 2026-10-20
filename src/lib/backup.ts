import { exportFiles, importFiles, type ExportedFile } from "@/lib/files"
import { replaceAllOnce, safeStorage } from "@/lib/safe-storage"
import { useStore } from "@/lib/store"
import type { Result } from "@/lib/types"

const APP = "hireme-demo-backup"
const STORAGE_KEY = "hireme-demo"

// The file is always built from the app's current saved data and current data version, so it follows
// every change to the app by itself. Files from older versions are upgraded by the store's migrate()
// when they are loaded, so keep that up to date whenever a field is added or changed.

/** Everything in the app (accounts, portfolios, conversations, messages, jobs, notifications, uploaded files) as a downloadable file. */
export async function downloadBackup() {
  const { users, talents, conversations, messages, jobs, notifications, currentUserId } = useStore.getState()
  // Uploaded photos and certificates live outside the app data (lib/files.ts); they go in the file too
  const files = await exportFiles().catch(() => [])
  const file = {
    app: APP,
    version: useStore.persist.getOptions().version,
    exportedAt: new Date().toISOString(),
    state: { users, talents, conversations, messages, jobs, notifications, currentUserId },
    files,
  }
  const url = URL.createObjectURL(new Blob([JSON.stringify(file, null, 2)], { type: "application/json" }))
  const link = document.createElement("a")
  link.href = url
  link.download = `hireme-demo-${file.exportedAt.slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

/** Replace everything with the contents of a backup file. The previous data is kept (reset's Undo restores it). */
export async function restoreFromFile(file: File): Promise<Result> {
  let parsed: { app?: unknown; version?: unknown; state?: Record<string, unknown>; files?: unknown }
  try {
    parsed = JSON.parse(await file.text())
  } catch {
    return { ok: false, error: "That file isn't a HireMe backup." }
  }
  const current = useStore.persist.getOptions().version ?? 0
  const state = parsed?.state
  if (parsed?.app !== APP || typeof parsed.version !== "number" || !state) {
    return { ok: false, error: "That file isn't a HireMe backup." }
  }
  if (parsed.version > current) return { ok: false, error: "This backup is from a newer version of the app." }
  for (const key of ["users", "talents", "conversations", "messages"]) {
    if (!Array.isArray(state[key])) return { ok: false, error: "This backup is damaged." }
  }

  // Saved like normal data: loading it runs the store's migrate() if the backup is from an older version
  replaceAllOnce(() => safeStorage.setItem(STORAGE_KEY, JSON.stringify({ state, version: parsed.version })))
  await useStore.persist.rehydrate()
  // Backups from before uploads existed have no files
  if (Array.isArray(parsed.files)) await importFiles(parsed.files as ExportedFile[]).catch(() => {})
  return { ok: true }
}
