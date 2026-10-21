"use client"

import { useEffect, useSyncExternalStore } from "react"
import { PageSkeleton } from "@/components/page-skeleton"
import { AwaitingApproval, ChooseRole, NotSetUp } from "@/components/real-screens"
import { BACKEND_READY, IS_DEMO } from "@/lib/mode"
import { startRealSync, useBackend } from "@/lib/real-sync"
import { useStore } from "@/lib/store"

// Wait for the data before rendering anything that reads it. The server always renders the loader.
// - Demo: the data comes from this browser's storage.
// - Real: from the database, once Supabase has said who's signed in (lib/real-sync.ts). Without a
//   Supabase project it shows "not set up"; Google sign-ups first choose job seeker or employer.
export function StoreGate({ children }: { children: React.ReactNode }) {
  const hydrated = useSyncExternalStore(
    (onChange) => useStore.persist.onFinishHydration(onChange),
    () => useStore.persist.hasHydrated(),
    () => false
  )
  const backend = useBackend((s) => s.status)
  const onboarded = useBackend((s) => s.onboarded)
  const approved = useBackend((s) => s.approved)
  useEffect(() => {
    if (!IS_DEMO) startRealSync()
  }, [])

  if (!IS_DEMO && !BACKEND_READY) return <NotSetUp />
  if (!hydrated || (!IS_DEMO && backend === "loading")) {
    return (
      // Placeholder shapes in the page's layout while the data loads
      <div className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 pt-5 sm:px-6 lg:px-8 lg:pt-8">
        <div className="h-14 animate-pulse rounded-xl bg-muted" />
        <PageSkeleton />
      </div>
    )
  }
  if (!IS_DEMO && backend === "signedIn" && !onboarded) return <ChooseRole />
  if (!IS_DEMO && backend === "signedIn" && !approved) return <AwaitingApproval />
  return children
}
