import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { PublicHeader, PublicFooter } from "@/components/PublicShell";
import { StickyCtaBanner } from "@/components/StickyCtaBanner";
import { WhatsAppButton } from "@/components/WhatsAppButton";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://neetcounselling.info"),
  title: {
    default: "NEET Counselling Info — Cutoffs, College Predictions & Expert Guidance",
    template: "%s | NEET Counselling Info",
  },
  description: "India's #1 NEET UG counselling guide. Latest cutoff analysis, college predictions, state-wise counselling updates, and expert admission guidance.",
  keywords: ["NEET counselling", "NEET cutoff 2026", "medical college admission", "NEET UG", "MCC counselling", "NEET rank predictor"],
  openGraph: {
    siteName: "NEET Counselling Info",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: '8FbHx3f_H7dBdXOZGNP4ekPAJczYXPSLOnn7CbtTb50',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif.variable}`}>
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <PublicHeader />
          <div className="flex-grow">
            {children}
          </div>
          <PublicFooter />
          <StickyCtaBanner />
          <WhatsAppButton />
        </div>
      </body>
    </html>
  );
}
