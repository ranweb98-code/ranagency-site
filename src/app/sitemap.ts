import type { MetadataRoute } from "next"

const SITE_URL = "https://napuch.co.il"

// The pages that should be findable. The CRM demo and the login are left out on
// purpose (they are noindex).
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/accessibility`, changeFrequency: "yearly", priority: 0.3 },
  ]
}
