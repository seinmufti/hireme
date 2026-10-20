import { cookies } from "next/headers"
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from "./locales"

/** The language picked in the language switcher (a cookie), or English. */
export async function getLocale() {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value
  return isLocale(value) ? value : DEFAULT_LOCALE
}
