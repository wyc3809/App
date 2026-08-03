import type { Metadata, Viewport } from "next";
import { DM_Sans, Newsreader } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Newsreader({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const assetBase = process.env.GITHUB_PAGES === "true" ? "/App" : "";

export const metadata: Metadata = {
  title: "WorthTracker — Net Worth & Wealth Tracking",
  description:
    "Track total net worth, assets vs liabilities, historical trends, and multi-currency portfolios — offline-first and private.",
  applicationName: "WorthTracker",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WorthTracker",
  },
  manifest: `${assetBase}/manifest.webmanifest`,
  icons: {
    icon: [{ url: `${assetBase}/icon.svg`, type: "image/svg+xml" }],
    apple: [{ url: `${assetBase}/icon.svg` }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f1ec" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1110" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${display.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
