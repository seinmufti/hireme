import { create } from "zustand"
import type { ExtraKey } from "@/lib/cv-extras"

/**
 * While the CV form is open: the sections added in it (saved or not), removing one, and the order of the
 * sections (dragged in Categories, saved with the form). The Categories list beside the form uses these;
 * `extras` is null when the form is closed.
 */
export const useCvEditor = create<{
  extras: ExtraKey[] | null
  remove: (key: ExtraKey) => void
  order: string[]
  setOrder: (order: string[] | null) => void
}>(() => ({ extras: null, remove: () => {}, order: [], setOrder: () => {} }))
