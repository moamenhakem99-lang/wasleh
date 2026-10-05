import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const tajawal = localFont({
  src: [
    { path: "../public/fonts/Tajawal-Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/Tajawal-Medium.ttf", weight: "500", style: "normal" },
    { path: "../public/fonts/Tajawal-Bold.ttf", weight: "700", style: "normal" },
    { path: "../public/fonts/Tajawal-ExtraBold.ttf", weight: "800", style: "normal" }
  ],
  variable: "--font-arabic",
  display: "swap"
});

export const metadata: Metadata = {
  title: "وصلة | WASLA",
  description: "منصة عربية لتأجير الجرارات والآليات الزراعية",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/logo.png", apple: "/logo.png" }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={tajawal.variable}>
      <body>{children}</body>
    </html>
  );
}
