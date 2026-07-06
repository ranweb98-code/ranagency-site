import type { Metadata } from "next";
import { Anton, Geist_Mono, Rubik } from "next/font/google";
import { LenisProvider } from "@/components/motion/lenis-provider";
import { CustomCursor } from "@/components/site/custom-cursor";
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
  title: "RanAgency — בוטים חכמים ואוטומציות AI",
  description: "אוטומציות AI, בוטים חכמים ובניית אתרים לעסקים קטנים ובינוניים בישראל",
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
        <CustomCursor />
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  );
}
