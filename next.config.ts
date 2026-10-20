import type { NextConfig } from "next";

// A second copy of the app (npm run dev:test, port 3001) has its own build folder, so it can run
// next to the main one. Different port = different browser storage, so tests on it never touch the
// data saved by the app on port 3000.
const isTestServer = process.env.HIREME_TEST_SERVER === "1"

/** The app lives under /hireme, so nordlyssolutions.com/hireme can serve it (see nordlys' hosted routes). */
const BASE_PATH = "/hireme"

const nextConfig: NextConfig = {
  distDir: isTestServer ? ".next-test" : ".next",
  basePath: BASE_PATH,
  // Lets client code prefix the few URLs Next.js doesn't (fetch, history.replaceState)
  env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH },
  async redirects() {
    return [
      // The bare domain (e.g. hireme-pink.vercel.app) opens the app
      { source: "/", destination: BASE_PATH, permanent: false, basePath: false },
      // Old addresses from before the app moved under /hireme (e.g. /profile/cv) still work
      { source: "/:path((?!hireme(?:/|$)|_next/|api/).*)", destination: `${BASE_PATH}/:path`, permanent: false, basePath: false },
      { source: "/", destination: "/login", permanent: false },
      { source: "/accounts", destination: "/login", permanent: false },
    ]
  },
  // The root layout reads the user agent (mobile gate), so pages render per request.
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
