"use client"

import { useMemo } from "react"
import { PoolBrowser } from "@/components/pool/pool-browser"
import type { PoolTalent } from "@/lib/filters"
import { toPoolTalent } from "@/lib/pool-talent"
import { listingMissing, useStore } from "@/lib/store"
import { useRoleGuard } from "@/lib/use-role-guard"

export function PoolView() {
  // Signed-in employers and recruiters only; job seekers don't use The Pool
  const viewer = useRoleGuard(["EMPLOYER", "RECRUITER"])
  const users = useStore((s) => s.users)
  const talents = useStore((s) => s.talents)
  const conversations = useStore((s) => s.conversations)

  const pool = useMemo<PoolTalent[]>(
    () =>
      talents
        .filter((t) => t.published)
        .flatMap((t) => {
          const u = users.find((x) => x.id === t.userId)
          // Only complete portfolios are listed; drafts stay private
          if (!u || listingMissing(u, t).length) return []
          const thread = viewer && conversations.find((c) => c.employerId === viewer.id && c.seekerId === u.id)
          return [toPoolTalent(u, t, thread ? thread.id : null)]
        })
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [talents, users, conversations, viewer]
  )

  if (!viewer) return null

  return (
    <PoolBrowser
      talents={pool}
      viewer={{ role: viewer.role, name: viewer.name, title: viewer.title, company: viewer.company }}
    />
  )
}
