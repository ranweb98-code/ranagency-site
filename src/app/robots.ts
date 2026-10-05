import type { MetadataRoute } from "next"

const SITE_URL = "https://napuch.co.il"

// Everything public may be crawled. The product itself (/app) is private and
// the /crm demo stays out of search through its own noindex tag, which crawlers
// can only read if they are allowed to fetch it — so /crm is not blocked here.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/app/", "/app"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
