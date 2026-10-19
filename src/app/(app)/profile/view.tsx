"use client"

import { ProfileForm } from "@/components/profile/profile-form"
import { useRoleGuard } from "@/lib/use-role-guard"

// The signed-in account's profile; signed-out visitors are sent to the login screen.
export function ProfileView() {
  const user = useRoleGuard()
  if (!user) return null
  // Keyed so switching accounts resets the form
  return <ProfileForm key={user.id} user={user} />
}
