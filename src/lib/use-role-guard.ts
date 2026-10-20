"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { GUEST_ID, homeFor, type Role } from "@/lib/options"
import { useCurrentUser, useStore } from "@/lib/store"

/**
 * Client-side route guard. Returns the current user when allowed, otherwise
 * null while it redirects: signed-out visitors go to /login, other roles to their home page.
 * Without `roles`, every signed-in role but the guest. Pages that allow guests (ANYONE) let signed-out
 * visitors in as the guest instead of sending them to /login.
 */
export function useRoleGuard(roles?: Role[]) {
  const user = useCurrentUser()
  const router = useRouter()
  const allowed = !!user && (roles ? roles.includes(user.role) : user.role !== "GUEST")
  const guestsWelcome = !!roles?.includes("GUEST")

  useEffect(() => {
    if (!user && guestsWelcome) useStore.getState().switchAccount(GUEST_ID)
    else if (!user) router.replace("/login")
    else if (!allowed) router.replace(homeFor(user.role))
  }, [user, allowed, guestsWelcome, router])

  return allowed ? user : null
}
