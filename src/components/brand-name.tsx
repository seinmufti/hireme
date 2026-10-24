import { Fragment } from "react"
import { cn } from "@/lib/utils"

/** The logo's colours: "Hire" in black, "Me!" in red. Always written this way wherever the name is shown. */
export const BRAND_BLACK = "#111111"
export const BRAND_RED = "#F03838"

export function BrandName({ className }: { className?: string }) {
  return (
    <span dir="ltr" className={cn("whitespace-nowrap", className)}>
      <span style={{ color: BRAND_BLACK }}>Hire</span>
      <span style={{ color: BRAND_RED }}>Me!</span>
    </span>
  )
}

/** Text that mentions HireMe (e.g. "Welcome to HireMe"), with the name in its colours. */
export function WithBrand({ text }: { text: string }) {
  return text.split(/(HireMe)/).map((part, i) => <Fragment key={i}>{part === "HireMe" ? <BrandName /> : part}</Fragment>)
}
