import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { HideOn } from "@/components/layout/HideOn";
import { Navbar } from "@/components/layout/Navbar";
import { site } from "@/content/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap", weight: ["600", "700", "800"] });

/** Pages that use their own minimal chrome instead of the marketing navbar and footer. */
const PRIVATE_FLOWS = ["/onboarding"];

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} | ${site.tagline}`, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  openGraph: { siteName: site.name, type: "website", locale: "en_US" },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b1120",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-accent-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <HideOn prefixes={PRIVATE_FLOWS}>
          <Navbar />
        </HideOn>
        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <HideOn prefixes={PRIVATE_FLOWS}>
          <Footer />
        </HideOn>
      </body>
    </html>
  );
}
