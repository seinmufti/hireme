"use client"

import { useSyncExternalStore } from "react"
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
      // Placeholder shapes in the page's layout while the data loads
      <div className="mx-auto w-full max-w-7xl flex-1 animate-pulse space-y-6 px-4 pt-5 sm:px-6 lg:px-8 lg:pt-8" aria-busy="true">
        <div className="h-14 rounded-xl bg-muted" />
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-md bg-muted" />
          <div className="h-4 w-72 max-w-full rounded-md bg-muted" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-44 rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    )
  }
  return children
}
