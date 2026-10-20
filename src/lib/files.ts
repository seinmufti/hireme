"use client"

import { useEffect, useState } from "react"

// Uploaded files (profile photos, scans of degrees, licenses, certificates) are kept in this browser's
// IndexedDB, which holds far more than localStorage. The app data only stores their ids.
// Like the rest of the demo data, they never leave the visitor's browser.

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
export const UPLOAD_ACCEPT = "image/*,application/pdf"

export type StoredFile = { id: string; name: string; type: string; blob: Blob; createdAt: string }

const DB_NAME = "hireme-files"
const STORE = "files"

let dbPromise: Promise<IDBDatabase> | null = null
function db() {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => {
      dbPromise = null
      reject(req.error)
    }
  })
  return dbPromise
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  const store = (await db()).transaction(STORE, mode).objectStore(STORE)
  return new Promise<T>((resolve, reject) => {
    const req = action(store)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** Shrinks photos to at most `maxSide` pixels on the longest side, as JPEG. Other files are kept as they are. */
export async function shrinkImage(file: Blob, maxSide = 1600, quality = 0.85): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml" || file.type === "image/gif") return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext("2d")!
    // JPEG has no transparency: put transparent images on white
    ctx.fillStyle = "#fff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const out = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality))
    // Keep the original if shrinking didn't make it smaller
    return out && out.size < file.size ? out : file
  } catch {
    return file
  }
}

/** Checks, shrinks and saves an uploaded file. Returns its id, or an error to show. */
export async function saveUpload(file: File, opts: { imagesOnly?: boolean; maxSide?: number } = {}) {
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false as const, error: `${file.name} is larger than 10 MB.` }
  const isImage = file.type.startsWith("image/")
  if (opts.imagesOnly ? !isImage : !isImage && file.type !== "application/pdf") {
    return { ok: false as const, error: opts.imagesOnly ? "Please choose an image." : "Please upload an image or a PDF." }
  }
  try {
    const blob = await shrinkImage(file, opts.maxSide)
    const name = blob === file ? file.name : file.name.replace(/\.\w+$/, "") + ".jpg"
    const id = `f-${crypto.randomUUID()}`
    await run("readwrite", (s) => s.put({ id, name, type: blob.type || file.type, blob, createdAt: new Date().toISOString() } satisfies StoredFile))
    notify()
    return { ok: true as const, id }
  } catch {
    return { ok: false as const, error: "The file couldn't be saved in this browser." }
  }
}

export const getFile = async (id: string) => ((await run("readonly", (s) => s.get(id))) as StoredFile | undefined) ?? null

export async function deleteFile(id: string) {
  await run("readwrite", (s) => s.delete(id))
  notify()
}

/** Saves a file as-is under a known id (used when restoring a backup). */
export async function putFile(file: StoredFile) {
  await run("readwrite", (s) => s.put(file))
  notify()
}

export const allFiles = async () => (await run("readonly", (s) => s.getAll())) as StoredFile[]

// Components showing a file reload it when files change (e.g. after restoring a backup)
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

/** The file's details and a URL to show it with; null while loading or when it doesn't exist. */
export function useStoredFile(id: string | null | undefined) {
  const [state, setState] = useState<{ id: string; file: StoredFile; url: string } | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1)
    listeners.add(bump)
    return () => void listeners.delete(bump)
  }, [])

  useEffect(() => {
    if (!id) return
    let url = ""
    let cancelled = false
    getFile(id)
      .then((file) => {
        if (cancelled) return
        if (!file) return setState(null)
        url = URL.createObjectURL(file.blob)
        setState({ id, file, url })
      })
      .catch(() => !cancelled && setState(null))
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [id, version])

  return id && state?.id === id ? state : null
}

/** Base64 versions of every stored file, for the backup download. */
export async function exportFiles() {
  const files = await allFiles()
  return Promise.all(
    files.map(async ({ blob, ...f }) => ({
      ...f,
      dataUrl: await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(blob)
      }),
    }))
  )
}

export type ExportedFile = Awaited<ReturnType<typeof exportFiles>>[number]

/** Puts files from a backup back. Files already stored stay. */
export async function importFiles(files: ExportedFile[]) {
  for (const { dataUrl, ...f } of files) {
    const blob = await (await fetch(dataUrl)).blob()
    await run("readwrite", (s) => s.put({ ...f, blob }))
  }
  notify()
}
