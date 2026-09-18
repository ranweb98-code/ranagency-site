import type { Metadata } from "next";
import { Anton, Geist_Mono, Rubik } from "next/font/google";
import { CurtainLoader } from "@/components/motion/curtain-loader";
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

/* Marks a tab that has already seen the intro curtain, so it plays once per
   session instead of on every navigation. Deliberately a raw parser-blocking
   <script> and not `next/script`: its strategies govern when an external file
   is fetched, and even `beforeInteractive` does not promise to run before the
   body paints — which is the entire job here. Inline and synchronous, this
   lands before the curtain markup below is even parsed, so the returning
   visitor never sees a frame of white. Keep the key in sync with
   SESSION_KEY in src/components/motion/curtain-loader.tsx. */
const CURTAIN_SESSION_SCRIPT = `try{if(sessionStorage.getItem("napuch:curtain-seen")==="1"){document.documentElement.dataset.curtain="skip"}}catch(e){}`;

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
        <script dangerouslySetInnerHTML={{ __html: CURTAIN_SESSION_SCRIPT }} />
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
        <LenisProvider>
          <CurtainLoader />
          {children}
        </LenisProvider>
      </body>
    </html>
  );
}
