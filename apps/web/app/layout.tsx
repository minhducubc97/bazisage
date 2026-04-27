import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "BaziSage — Your AI Grandmaster",
    template: "%s | BaziSage",
  },
  description:
    "Discover your destiny with BaziSage — an AI-powered Bazi (Four Pillars of Destiny) advisor that combines authentic Chinese metaphysics with modern AI for personalized, proactive life guidance.",
  keywords: [
    "Bazi", "Four Pillars", "Chinese astrology", "fortune telling",
    "Zi Wei Dou Shu", "AI astrology", "destiny reading",
  ],
  authors: [{ name: "BaziSage" }],
  openGraph: {
    title: "BaziSage — Your AI Grandmaster",
    description: "Authentic Bazi readings with True Solar Time accuracy and persistent AI wisdom.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "BaziSage — Your AI Grandmaster",
    description: "Authentic Bazi readings powered by AI.",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0F",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head />
      <body>
        <div id="app-root">
          {children}
        </div>
      </body>
    </html>
  );
}
