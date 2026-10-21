// The same app runs in two modes, chosen when it's built (NEXT_PUBLIC_HIREME_MODE):
// - demo (/hireme/demo): ready-made demo accounts, everything saved in this browser, Dev tools.
// - real (/hireme): sign-up and sign-in, data in the Supabase database, nobody sees another's account.
// Pages, design and layout are shared; only where data comes from and how people sign in differ.

export const IS_DEMO = process.env.NEXT_PUBLIC_HIREME_MODE === "demo"

/** The real version needs its Supabase project; without it, it shows a "not set up" screen. */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
export const BACKEND_READY = !IS_DEMO && !!SUPABASE_URL && !!SUPABASE_ANON_KEY

/** Where the app lives: "/hireme" (real) or "/hireme/demo". */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
