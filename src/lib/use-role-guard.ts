"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { homeFor, type Role } from "@/lib/options"
import { useCurrentUser } from "@/lib/store"

/**
 * Client-side route guard. Returns the current user when allowed, otherwise
 * null while it redirects: signed-out visitors go to /login, other roles to their home page.
 */
export function useRoleGuard(roles?: Role[]) {
  const user = useCurrentUser()
  const router = useRouter()
  const allowed = !!user && (!roles || roles.includes(user.role))

  useEffect(() => {
    if (!user) router.replace("/login")
    else if (!allowed) router.replace(homeFor(user.role))
  }, [user, allowed, router])

  return allowed ? user : null
}
