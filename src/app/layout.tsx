import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { Providers } from "@/components/Providers";
import { getPublicAssetBase } from "@/lib/public-asset-base";
import "./globals.css";

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const assetBase = getPublicAssetBase();

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
    icon: [
      { url: `${assetBase}/icon.svg`, type: "image/svg+xml" },
      { url: `${assetBase}/favicon-32.png`, sizes: "32x32", type: "image/png" },
      { url: `${assetBase}/icon-192.png`, sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: `${assetBase}/apple-touch-icon.png`, sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0c0b" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const themeBootScript = `(function(){try{var k=localStorage.getItem('worthtracker-v1');if(!k)return;var p=JSON.parse(k);var th=p.state&&p.state.settings&&p.state.settings.theme;var r=document.documentElement;if(th==='dark')r.classList.add('dark');else if(th==='light')r.classList.remove('dark');else if(window.matchMedia('(prefers-color-scheme: dark)').matches)r.classList.add('dark');else r.classList.remove('dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className={`${sans.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
