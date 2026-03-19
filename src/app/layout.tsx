import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forgedads.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ForgedAds — AI-Powered Ad Creative Platform",
    template: "%s — ForgedAds",
  },
  description:
    "Generate studio-quality product photos, ad creatives, and video in seconds. Built for e-commerce brands that move fast.",
  keywords: [
    "AI ad generator",
    "ad creative platform",
    "product photography AI",
    "e-commerce ads",
    "AI video ads",
    "brand kit",
    "ad templates",
  ],
  authors: [{ name: "ForgedAds" }],
  creator: "ForgedAds",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "ForgedAds",
    title: "ForgedAds — AI-Powered Ad Creative Platform",
    description:
      "Generate studio-quality product photos, ad creatives, and video in seconds. Built for e-commerce brands that move fast.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ForgedAds — AI-Powered Ad Creative Platform",
    description:
      "Generate studio-quality product photos, ad creatives, and video in seconds.",
    creator: "@forgedads",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster theme="dark" richColors closeButton />
      </body>
    </html>
  );
}
