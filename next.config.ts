import type { NextConfig } from "next";

// A second copy of the app (npm run dev:test, port 3001) has its own build folder, so it can run
// next to the main one. Different port = different browser storage, so tests on it never touch the
// data saved by the app on port 3000.
const isTestServer = process.env.HIREME_TEST_SERVER === "1"

const nextConfig: NextConfig = {
  distDir: isTestServer ? ".next-test" : ".next",
  async redirects() {
    return [
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
