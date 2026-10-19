/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils"

export const LOGO_URL =
  "https://media.licdn.com/dms/image/v2/D4E0BAQFTIgRuTfqPfw/company-logo_200_200/company-logo_200_200/0/1695380706358/hiremeqatar_logo?e=2147483647&v=beta&t=NMnjnEO9G8CRUDJRLjNp2tcn8BOLdyP_rQPjxAfHsUM"

export function Logo({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <img
      src={LOGO_URL}
      alt="HireMe"
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      className={cn("rounded-md bg-white object-contain ring-1 ring-black/5", className)}
    />
  )
}
