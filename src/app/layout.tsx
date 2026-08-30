import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const assetBase = process.env.GITHUB_PAGES === "true" ? "/App" : "";

export const metadata: Metadata = {
  title: "WorthBook — Net Worth & Wealth Tracking",
  description:
    "Track total net worth, assets vs liabilities, historical trends, and multi-currency portfolios — offline-first and private.",
  applicationName: "WorthBook",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WorthBook",
  },
  manifest: `${assetBase}/manifest.webmanifest`,
  icons: {
    icon: [{ url: `${assetBase}/icon.svg`, type: "image/svg+xml" }],
    apple: [{ url: `${assetBase}/icon.svg` }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0c0b" },
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
      <body className={`${sans.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
