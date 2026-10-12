import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  // The agreement text and the PDF font are read from disk at runtime, which
  // the file tracer cannot see on its own.
  outputFileTracingIncludes: {
    "/api/sign/verify": ["./contracts/**/*", "./assets/fonts/**/*"],
    "/admin/contracts": ["./contracts/**/*"],
  },
  // Signing links and the owner screen are never indexed.
  async headers() {
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }]
    return [
      { source: "/sign/:path*", headers: noindex },
      { source: "/admin/:path*", headers: noindex },
    ]
  },
  images: {
    qualities: [75, 90, 100],
  },
  experimental: {
    // Going back to a screen visited a moment ago is instant instead of another
    // trip to the database. Saving anything refreshes the cache, so a change
    // you make is never hidden by it; only another person's change can take up
    // to this long to appear on a revisit.
    staleTimes: { dynamic: 20 },
  },
};

export default nextConfig;
