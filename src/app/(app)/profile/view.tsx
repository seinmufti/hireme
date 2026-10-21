"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProfileForm } from "@/components/profile/profile-form"
import { useRoleGuard } from "@/lib/use-role-guard"

// The signed-in account's profile; signed-out visitors are sent to the login screen.
// A job seeker's CV lives in their Profile tab (/overview), so old links (e.g. ?edit=work) go there.
export function ProfileView() {
  const user = useRoleGuard()
  const router = useRouter()
  const isSeeker = user?.role === "SEEKER"
  useEffect(() => {
    if (isSeeker) router.replace(`/overview${window.location.search}`)
  }, [isSeeker, router])
  if (!user || isSeeker) return null
  // Keyed so switching accounts resets the form
  return <ProfileForm key={user.id} user={user} />
}
