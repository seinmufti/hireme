/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils"

/** HireMe's official logo: the figure under the leaves (public/logo-mark.png; the full logo with its slogan is logo-full.jpg). */
export const LOGO_URL = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/logo-mark.png`

export function Logo({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <img
      src={LOGO_URL}
      alt="HireMe"
      width={size}
      height={size}
      className={cn("rounded-md bg-white object-contain ring-1 ring-black/5", className)}
    />
  )
}
