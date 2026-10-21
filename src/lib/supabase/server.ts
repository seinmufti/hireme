import { createServerClient } from "@supabase/ssr"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { BACKEND_READY, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/mode"

/**
 * Redirects to a path on the same site. Relative on purpose: behind nordlyssolutions.com's proxy the request
 * arrives at the Vercel address, and an absolute redirect would send people there instead.
 */
export function goTo(path: string) {
  return new Response(null, { status: 303, headers: { Location: path } })
}

/** Supabase as the signed-in visitor (their cookies), for route handlers and server pages. Null when not set up. */
export async function serverSupabase(): Promise<SupabaseClient | null> {
  if (!BACKEND_READY) return null
  const store = await cookies()
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options)
        } catch {
          // Called from a server page: cookies are refreshed by the proxy instead
        }
      },
    },
  })
}

/**
 * Supabase with full rights (the service role key), for admin work only: giving the recruiter role.
 * Never sent to the browser. Null when the key isn't set.
 */
export function adminSupabase(): SupabaseClient | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!BACKEND_READY || !key) return null
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false } })
}

/** The admins (comma-separated emails in ADMIN_EMAILS): they can give the recruiter role. */
export const isAdminEmail = (email: string | undefined | null) =>
  !!email &&
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase())

/**
 * Real version: may the signed-in user make one more AI request of this kind? Each request costs money, so
 * every user has a limit per feature, per day or for the whole account (counted in the database, see
 * take_ai_credit and take_ai_credit_total).
 */
export async function aiAccess(kind: string, limit: { perDay: number } | { total: number }): Promise<"ok" | "signedOut" | "limit"> {
  const db = await serverSupabase()
  if (!db || !(await db.auth.getUser()).data.user) return "signedOut"
  const { data, error } =
    "total" in limit
      ? await db.rpc("take_ai_credit_total", { kind, total_limit: limit.total })
      : await db.rpc("take_ai_credit", { kind, daily_limit: limit.perDay })
  return !error && data === true ? "ok" : "limit"
}
