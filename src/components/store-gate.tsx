"use client"

import { useSyncExternalStore } from "react"
import { Loader2Icon } from "lucide-react"
import { useStore } from "@/lib/store"

// Data comes from localStorage, so wait for it before rendering anything that reads it.
// The server always renders the loader; the browser shows the app as soon as data has loaded.
export function StoreGate({ children }: { children: React.ReactNode }) {
  const hydrated = useSyncExternalStore(
    (onChange) => useStore.persist.onFinishHydration(onChange),
    () => useStore.persist.hasHydrated(),
    () => false
  )

  if (!hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  return children
}
