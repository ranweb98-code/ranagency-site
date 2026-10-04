import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
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
