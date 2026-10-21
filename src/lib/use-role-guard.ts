"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { GUEST_ID, homeFor, type Role } from "@/lib/options"
import { VISITOR_ID } from "@/lib/real-sync"
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
    // Real version: a signed-out visitor opening a private page signs in first
    else if (!allowed) router.replace(user.id === VISITOR_ID ? "/login" : homeFor(user.role))
  }, [user, allowed, guestsWelcome, router])

  return allowed ? user : null
}
