import type { Metadata } from "next";
import { Anton, Geist_Mono, Rubik } from "next/font/google";
import { LenisProvider } from "@/components/motion/lenis-provider";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["hebrew", "latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "נפוץ' — סוכני AI לוואטסאפ, אינסטגרם וטלפון",
  description:
    "סוכני AI לוואטסאפ, אינסטגרם וטלפון שעונים ללקוחות, מסווגים לידים חמים וקרים וקובעים תורים אוטומטית — הכל בדשבורד CRM אחד",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${rubik.variable} ${geistMono.variable} ${anton.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Keyboard/screen-reader users otherwise have to tab through the
            entire floating nav pill on every single page before reaching
            real content — this jumps straight to #main-content. Hidden
            until focused (sr-only → visible), per standard skip-link
            practice, and required for WCAG 2.4.1 / Israeli Standard 5568. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:right-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ran-text-on-light focus:px-5 focus:py-2.5 focus:text-sm focus:font-bold focus:text-white"
        >
          דלג לתוכן הראשי
        </a>
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  );
}
