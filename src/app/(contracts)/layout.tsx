import type { Metadata, Viewport } from "next"
import { Rubik } from "next/font/google"

import "../globals.css"

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["hebrew", "latin"],
})

// Signing links and the owner's contract screen are private: never indexed,
// never in the sitemap (and blocked in robots.ts and by an X-Robots-Tag header).
// Like /crm, this is its own root layout: none of the marketing site's chrome.
export const metadata: Metadata = {
  title: { default: "נפוץ' AI", template: "%s · נפוץ' AI" },
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f5f4",
}

export default function ContractsRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} h-full antialiased`}>
      <body className="min-h-full bg-ran-surface-subtle font-sans text-ran-text-on-light">{children}</body>
    </html>
  )
}
