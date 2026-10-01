import type { Metadata, Viewport } from "next"
import { Rubik } from "next/font/google"

import "../globals.css"

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["hebrew", "latin"],
})

// The CRM is a second root layout: it deliberately shares nothing with the
// marketing site's — no intro curtain, no smooth-scroll hijack — so inner
// scroll areas and the app-like chrome behave like an app.
export const metadata: Metadata = {
  title: { default: "נפוץ' CRM", template: "%s · נפוץ' CRM" },
  description: "כל הפניות, השיחות והעסקאות של העסק שלכם במקום אחד",
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#dfe6f4",
}

export default function CrmRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
