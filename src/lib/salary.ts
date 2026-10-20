import type { Currency, Salary } from "@/lib/types"

// Salaries are a month. Dollars as "$1,500", dinars as "750,000 IQD".

export const CURRENCIES: Currency[] = ["IQD", "USD"]

const amount = (n: number) => n.toLocaleString("en")

/** "$1,500" / "750,000 IQD" */
export const formatMoney = (n: number, currency: Currency) => (currency === "USD" ? `$${amount(n)}` : `${amount(n)} IQD`)

/** "$1,500–2,200" / "750,000–1,200,000 IQD"; null with only one end (see useSalaryLabel) */
export function formatRange(s: Salary) {
  if (!s.min || !s.max) return null
  if (s.min === s.max) return formatMoney(s.min, s.currency)
  return s.currency === "USD" ? `$${amount(s.min)}–${amount(s.max)}` : `${amount(s.min)}–${amount(s.max)} IQD`
}

/** Digits only, for the salary boxes ("1,200,000" → 1200000); empty → null. */
export const parseAmount = (text: string) => {
  const digits = text.replace(/[^0-9]/g, "")
  return digits ? Number(digits) : null
}
