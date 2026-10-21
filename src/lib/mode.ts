// The same app runs in two modes, chosen when it's built (NEXT_PUBLIC_HIREME_MODE):
// - demo (/demo): ready-made demo accounts, everything saved in this browser, Dev tools.
// - real (the root): sign-up and sign-in, data in the Supabase database, nobody sees another's account.
// Pages, design and layout are shared; only where data comes from and how people sign in differ.

export const IS_DEMO = process.env.NEXT_PUBLIC_HIREME_MODE === "demo"

/** The real version needs its Supabase project; without it, it shows a "not set up" screen. */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
export const BACKEND_READY = !IS_DEMO && !!SUPABASE_URL && !!SUPABASE_ANON_KEY

/** "Continue with Google" is shown once Google is set up in Supabase (NEXT_PUBLIC_GOOGLE_SIGN_IN=1). */
export const GOOGLE_SIGN_IN = process.env.NEXT_PUBLIC_GOOGLE_SIGN_IN === "1"

/** Where the app lives: "" or "/demo" locally; "/hireme" or "/hireme/demo" deployed. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
