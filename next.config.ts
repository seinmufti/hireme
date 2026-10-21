import type { NextConfig } from "next";

// Two builds of one app (see src/lib/mode.ts): the real HireMe and its demo at /demo.
// NEXT_PUBLIC_HIREME_MODE=demo builds the demo.
const isDemo = process.env.NEXT_PUBLIC_HIREME_MODE === "demo"

// A second copy of the app (npm run dev:test, port 3001) has its own build folder, so it can run
// next to the main one. Different port = different browser storage, so tests on it never touch the
// data saved by the app on port 3000.
const isTestServer = process.env.HIREME_TEST_SERVER === "1"

/**
 * Where the app is mounted. Deployed (Vercel), it's /hireme, so nordlyssolutions.com/hireme can show it
 * next to Nordlys' own pages. Locally it's the root: localhost:3000 and localhost:3000/demo.
 */
const MOUNT = process.env.VERCEL ? "/hireme" : ""
const BASE_PATH = isDemo ? `${MOUNT}/demo` : MOUNT
// "hireme" or "hireme/demo", for matching addresses outside the app
const SEGMENT = BASE_PATH.slice(1).replace("/", "\\/")

/** The demo is its own deployment (its own server locally); the real app shows it at /demo. */
const DEMO_ORIGIN = process.env.HIREME_DEMO_ORIGIN ?? (process.env.VERCEL ? "https://hireme-demo.vercel.app" : "http://localhost:3002")

const nextConfig: NextConfig = {
  // Separate build folders so the copies can run side by side locally; Vercel always expects .next
  distDir: process.env.VERCEL ? ".next" : isTestServer ? ".next-test" : isDemo ? ".next-demo" : ".next",
  basePath: BASE_PATH,
  // Lets client code prefix the few URLs Next.js doesn't (fetch, history.replaceState)
  env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH },
  async redirects() {
    return [
      ...(BASE_PATH
        ? [
            // The bare domain (e.g. hireme-pink.vercel.app) opens the app
            { source: "/", destination: BASE_PATH, permanent: false, basePath: false as const },
            // Old addresses from outside the base path (e.g. /profile/cv) still work
            { source: `/:path((?!${SEGMENT}(?:/|$)|_next/|api/).*)`, destination: `${BASE_PATH}/:path`, permanent: false, basePath: false as const },
          ]
        : []),
      // The app's root: sign-in, which sends signed-in people on to their home page
      { source: "/", destination: "/login", permanent: false },
      { source: "/accounts", destination: "/login", permanent: false },
    ]
  },
  async headers() {
    return [
      {
        // Basic protection on every page: no framing by other sites, no guessing file types, no leaking
        // full addresses to other sites, and no camera/microphone/location unless a page asks for them
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ]
  },
  async rewrites() {
    if (isDemo) return []
    return [
      { source: "/demo", destination: `${DEMO_ORIGIN}${MOUNT}/demo` },
      { source: "/demo/:path*", destination: `${DEMO_ORIGIN}${MOUNT}/demo/:path*` },
    ]
  },
  // The root layout reads the language cookie, so pages render per request.
  cacheComponents: false,
  partialPrefetching: false,
  turbopack: {
    // The real version doesn't download the demo's sample accounts, CVs and jobs (see src/data/demo-none.ts)
    resolveAlias: isDemo ? {} : { "@/data/demo": "./src/data/demo-none.ts", "@/data/demo-jobs": "./src/data/demo-none.ts" },
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
