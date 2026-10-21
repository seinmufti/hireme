import type { NextRequest } from "next/server"
import { goTo, serverSupabase } from "@/lib/supabase/server"

// Real version: Supabase sends people here after confirming their email, signing in with Google, or
// opening a password reset link. The code in the link becomes their session; then on to `next`
// (/login, which sends signed-in people to their home page; or /reset-password).
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const next = url.searchParams.get("next") ?? "/login"
  // Only paths inside the app
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/login"
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

  const db = await serverSupabase()
  if (db && code) {
    const { error } = await db.auth.exchangeCodeForSession(code)
    if (!error) return goTo(`${base}${safeNext}`)
  }
  return goTo(`${base}/login?error=link`)
}
