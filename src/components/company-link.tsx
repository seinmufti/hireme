import Link from "next/link"
import { cn } from "@/lib/utils"

/** A company's name (or logo) that opens its page. Sits above a card's whole-card link, so it can be clicked. */
export function CompanyLink({ employerId, children, className, label }: { employerId: string; children: React.ReactNode; className?: string; label?: string }) {
  return (
    <Link href={`/companies/${employerId}`} aria-label={label} className={cn("relative z-10 hover:text-foreground hover:underline", className)}>
      {children}
    </Link>
  )
}
