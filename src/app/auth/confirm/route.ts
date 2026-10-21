import type { EmailOtpType } from "@supabase/supabase-js"
import type { NextRequest } from "next/server"
import { goTo, serverSupabase } from "@/lib/supabase/server"

// Real version: the links in HireMe's emails (confirm your account, reset your password) come here, on
// HireMe's own address rather than Supabase's (emails whose links go elsewhere look like spam).
// The token in the link becomes their session; then on to `next` (/login, which sends signed-in people
// to their home page; or /reset-password).
const TYPES: EmailOtpType[] = ["signup", "email", "recovery", "email_change", "invite", "magiclink"]

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const tokenHash = url.searchParams.get("token_hash")
  const type = url.searchParams.get("type") as EmailOtpType | null
  const next = url.searchParams.get("next") ?? "/login"
  // Only paths inside the app
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/login"
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

  const db = await serverSupabase()
  if (db && tokenHash && type && TYPES.includes(type)) {
    const { error } = await db.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) return goTo(`${base}${safeNext}`)
  }
  return goTo(`${base}/login?error=link`)
}
