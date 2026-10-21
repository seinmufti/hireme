"use client"

import { useSyncExternalStore } from "react"
import { PageSkeleton } from "@/components/page-skeleton"
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
      <div className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 pt-5 sm:px-6 lg:px-8 lg:pt-8">
        <div className="h-14 animate-pulse rounded-xl bg-muted" />
        <PageSkeleton />
      </div>
    )
  }
  return children
}
