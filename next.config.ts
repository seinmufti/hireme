import type { NextConfig } from "next";

// Two builds of one app (see src/lib/mode.ts): the real HireMe at /hireme and the demo at /hireme/demo.
// NEXT_PUBLIC_HIREME_MODE=demo builds the demo.
const isDemo = process.env.NEXT_PUBLIC_HIREME_MODE === "demo"

// A second copy of the app (npm run dev:test, port 3001) has its own build folder, so it can run
// next to the main one. Different port = different browser storage, so tests on it never touch the
// data saved by the app on port 3000.
const isTestServer = process.env.HIREME_TEST_SERVER === "1"

/** The app lives under /hireme (and the demo under /hireme/demo), so nordlyssolutions.com can serve both. */
const BASE_PATH = isDemo ? "/hireme/demo" : "/hireme"
// "hireme" or "hireme/demo", for matching addresses outside the app
const SEGMENT = BASE_PATH.slice(1).replace("/", "\\/")

const nextConfig: NextConfig = {
  distDir: isTestServer ? ".next-test" : isDemo ? ".next-demo" : ".next",
  basePath: BASE_PATH,
  // Lets client code prefix the few URLs Next.js doesn't (fetch, history.replaceState)
  env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH },
  async redirects() {
    return [
      // The bare domain (e.g. hireme-pink.vercel.app) opens the app
      { source: "/", destination: BASE_PATH, permanent: false, basePath: false },
      // Old addresses from before the app moved under its base path (e.g. /profile/cv) still work
      { source: `/:path((?!${SEGMENT}(?:/|$)|_next/|api/).*)`, destination: `${BASE_PATH}/:path`, permanent: false, basePath: false },
      { source: "/", destination: "/login", permanent: false },
      { source: "/accounts", destination: "/login", permanent: false },
    ]
  },
  // The root layout reads the language cookie, so pages render per request.
  cacheComponents: false,
  partialPrefetching: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
