import type { Metadata } from "next";
import { Figtree, Geist_Mono, Noto_Sans } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";

// Figtree / Noto Sans -- ui-ux-pro-max's healthcare/professional/trustworthy
// pairing recommendation for this product type. Figtree carries headings
// (warm, rounded humanist sans), Noto Sans carries body/UI text.
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Out-of-Hours Call Log",
  description: "Call log and review dashboard for Jewel Home Support's out-of-hours voice agent.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} ${notoSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
