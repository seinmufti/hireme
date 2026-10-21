import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Real version: keeps the visitor's Supabase sign-in fresh on every page (the session cookie is renewed
// before it expires). The demo has no sign-in, so it passes straight through.
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (process.env.NEXT_PUBLIC_HIREME_MODE === "demo" || !url || !key) return NextResponse.next()
  // Visitors who aren't signed in have no session to renew
  if (!request.cookies.getAll().some((c) => c.name.startsWith("sb-"))) return NextResponse.next()

  let response = NextResponse.next({ request })
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of list) response.cookies.set(name, value, options)
      },
    },
  })
  // Renews the session if needed (the result itself isn't used here). getClaims checks the sign-in
  // token's signature locally, so most pages don't wait on a call to Supabase.
  await client.auth.getClaims()
  return response
}

export const config = {
  // Pages only: not Next.js files, images or the app's static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|logo-.*|.*\\.(?:png|jpg|svg|webp)$).*)"],
}
