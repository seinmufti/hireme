import { cn } from "@/lib/utils"

export function initials(name: string) {
  const parts = name.split(/[\s-]+/).filter(Boolean)
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase()
}

export function UserAvatar({
  name,
  color,
  size = 40,
  className,
}: {
  name: string
  color: string
  size?: number
  className?: string
}) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white select-none", className)}
      style={{ backgroundColor: color, width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}
