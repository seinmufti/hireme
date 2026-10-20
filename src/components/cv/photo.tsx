"use client"

/* eslint-disable @next/next/no-img-element */
import { UserAvatar } from "@/components/user-avatar"
import { useStoredFile } from "@/lib/files"
import { cn } from "@/lib/utils"

/** The profile photo, or the colored initials while there is none. */
export function ProfilePhoto({
  photoId,
  name,
  color,
  size,
  className,
}: {
  photoId: string
  name: string
  color: string
  size: number
  className?: string
}) {
  const photo = useStoredFile(photoId)
  if (!photo) return <UserAvatar name={name} color={color} size={size} className={className} />
  return (
    <img
      src={photo.url}
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0 rounded-full object-cover", className)}
      style={{ width: size, height: size }}
    />
  )
}

/** A country's flag as an image: Windows doesn't draw flag emoji (COUNTRIES[].flag), so they'd show as letters there. */
export function Flag({ code, className }: { code: string; className?: string }) {
  if (!/^[A-Z]{2}$/.test(code)) return null
  return (
    <img
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      alt=""
      width={16}
      height={12}
      referrerPolicy="no-referrer"
      className={cn("inline-block h-[0.75em] w-auto rounded-[1px] align-[-0.05em] ring-1 ring-black/10", className)}
    />
  )
}
