import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ["ui-serif", "Georgia", "serif"],
});

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal"],
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#180E26",
};

export const metadata: Metadata = {
  title: "Legacy Vault — Enterprise-Grade Digital Asset Infrastructure",
  description:
    "Secure, scalable blockchain infrastructure for businesses, enterprises, and governments to manage digital assets with ease and compliance.",
  metadataBase: new URL("https://legacyvault.com"),
  openGraph: {
    title: "Legacy Vault — Enterprise-Grade Digital Asset Infrastructure",
    description: "Secure, scalable blockchain infrastructure for businesses and developers.",
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
      className={`${display.variable} ${sans.variable} h-full`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-white text-[#180E26] antialiased font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
