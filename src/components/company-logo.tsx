"use client"

/* eslint-disable @next/next/no-img-element */
import { initials } from "@/components/user-avatar"
import { useStoredFile } from "@/lib/files"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

/**
 * A company's logo (the employer's uploaded picture), or its initials in its colour while there's none. Square
 * with rounded corners, so logos aren't cut into circles. Give the employer's id (looked up) or the employer.
 */
export function CompanyLogo({
  employerId,
  employer: given,
  name,
  size = 40,
  className,
}: {
  employerId?: string
  employer?: { photoId: string; avatarColor: string; company: string; name: string }
  /** The company name, when the employer isn't known (e.g. their account is gone) */
  name?: string
  size?: number
  className?: string
}) {
  const found = useStore((s) => (given || !employerId ? null : s.users.find((u) => u.id === employerId)))
  const employer = given ?? found
  const photo = useStoredFile(employer?.photoId ?? "")
  const label = employer?.company || employer?.name || name || "?"
  const box = { width: size, height: size }
  if (photo)
    return (
      <img
        src={photo.url}
        alt=""
        width={size}
        height={size}
        className={cn("shrink-0 rounded-lg border bg-white object-contain p-0.5", className)}
        style={box}
      />
    )
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-lg font-semibold text-white select-none", className)}
      style={{ ...box, backgroundColor: employer?.avatarColor ?? "#64748B", fontSize: size * 0.36 }}
    >
      {initials(label)}
    </span>
  )
}
