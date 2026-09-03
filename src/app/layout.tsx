import type { Metadata, Viewport } from "next";
import { Fraunces } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { BRAND, SITE_URL } from "@/lib/config";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

// One display serif, loaded as a single static weight to keep the font payload small.
// Body text uses the system sans stack (see globals.css).
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND}: a sauna boat on San Francisco Bay`,
    template: `%s | ${BRAND}`,
  },
  description:
    "A captained, wood-fired sauna boat sailing Richardson Bay from Sausalito, with cold plunges straight into San Francisco Bay. Launching 2027. Reserve with a refundable deposit.",
  openGraph: {
    type: "website",
    siteName: BRAND,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#14202b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
