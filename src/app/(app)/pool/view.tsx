"use client"

import { useMemo } from "react"
import { PoolBrowser } from "@/components/pool/pool-browser"
import type { PoolTalent } from "@/lib/filters"
import { ageFrom, firstName, highestEducation, totalMonths } from "@/lib/format"
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
          // Fields are picked one by one. Employers get the first name only and never the
          // job seeker's contact details or exact birth date - they reach out through HireMe messages.
          return [
            {
              id: t.id,
              userId: t.userId,
              firstName: firstName(u.name),
              avatarColor: u.avatarColor,
              gender: t.gender,
              age: ageFrom(t.dateOfBirth),
              education: highestEducation(t.degrees),
              degrees: t.degrees,
              certifications: t.certifications,
              languages: t.languages,
              experiences: t.experiences,
              totalMonths: totalMonths(t.experiences),
              updatedAt: t.updatedAt,
              conversationId: thread ? thread.id : null,
            },
          ]
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
