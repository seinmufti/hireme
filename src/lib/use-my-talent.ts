"use client"

import type { MatchableTalent } from "@/lib/matching"
import { useStore } from "@/lib/store"
import type { Talent } from "@/lib/types"

/** The signed-in job seeker's portfolio, for matching them with jobs. Null for other roles. */
export function useMyTalent(): (Talent & MatchableTalent) | null {
  return useStore((s) => {
    const me = s.users.find((u) => u.id === s.currentUserId)
    return me?.role === "SEEKER" ? (s.talents.find((t) => t.userId === me.id) ?? null) : null
  })
}
