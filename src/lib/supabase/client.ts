"use client"

import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { BACKEND_READY, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/mode"

let client: SupabaseClient | null = null

/** The browser's Supabase client (real version only; null in the demo or before Supabase is set up). */
export function supabase(): SupabaseClient | null {
  if (!BACKEND_READY) return null
  client ??= createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  return client
}
