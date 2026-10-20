"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { User } from "@/lib/types"

// HireMe Premium: one year of unlimited CV downloads without a watermark. There's no payment yet:
// job seekers are premium unless they switch it off with the demo switch in the header, so both
// modes can be seen. Replace this store with the real subscription to lock the premium features.

type PremiumState = {
  // Job seekers who switched Premium off in the demo; everyone else is premium
  freeUserIds: string[]
  setPremium: (userId: string, premium: boolean) => void
}

export const usePremiumStore = create<PremiumState>()(
  persist(
    (set) => ({
      freeUserIds: [],
      setPremium: (userId, premium) =>
        set((s) => ({
          freeUserIds: premium ? s.freeUserIds.filter((id) => id !== userId) : [...new Set([...s.freeUserIds, userId])],
        })),
    }),
    { name: "hireme-premium", storage: createJSONStorage(() => localStorage) }
  )
)

/** Whether the account has HireMe Premium. */
export const isPremium = (user: Pick<User, "id"> | null, freeUserIds = usePremiumStore.getState().freeUserIds) =>
  !!user && !freeUserIds.includes(user.id)

/** Like isPremium, and updates when the demo switch changes. */
export function useIsPremium(user: Pick<User, "id"> | null) {
  const freeUserIds = usePremiumStore((s) => s.freeUserIds)
  return isPremium(user, freeUserIds)
}
