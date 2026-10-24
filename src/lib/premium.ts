"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { IS_DEMO } from "@/lib/mode"
import { useBackend } from "@/lib/real-sync"
import type { User } from "@/lib/types"

// HireMe Premium: the whole CV and downloading it as a PDF. There's no payment yet: people contact HireMe
// to get it (see PremiumContactDialog) and an admin switches it on for a year (the admin page). Nobody has
// it by default. In the demo it's switched on and off with the crown in Dev tools.

type PremiumState = {
  // Demo: the accounts switched to Premium with the Dev tools crown
  premiumUserIds: string[]
  setPremium: (userId: string, premium: boolean) => void
}

export const usePremiumStore = create<PremiumState>()(
  persist(
    (set) => ({
      premiumUserIds: [],
      setPremium: (userId, premium) =>
        set((s) => ({
          premiumUserIds: premium ? [...new Set([...s.premiumUserIds, userId])] : s.premiumUserIds.filter((id) => id !== userId),
        })),
    }),
    // Version 1: Premium is opt-in (earlier everyone had it unless switched off), so older saved state is dropped
    { name: "hireme-premium", version: 1, migrate: () => ({ premiumUserIds: [] }) as unknown as PremiumState, storage: createJSONStorage(() => localStorage) }
  )
)

/** Whether the signed-in account has HireMe Premium (demo: the Dev tools crown; real: given by an admin). */
export function useIsPremium(user: Pick<User, "id"> | null) {
  const premiumUserIds = usePremiumStore((s) => s.premiumUserIds)
  const realPremium = useBackend((s) => s.premium)
  if (!user) return false
  return IS_DEMO ? premiumUserIds.includes(user.id) : realPremium
}
