import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SITE_CONFIG, withBasePath, absoluteUrl } from "@/lib/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0d0e12",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.siteUrl),
  title: {
    default: `${SITE_CONFIG.name} | Local-first AI coding workspace`,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  icons: {
    icon: withBasePath("/app-icon.png"),
    apple: withBasePath("/app-icon.png"),
  },
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    title: `${SITE_CONFIG.name} | Local-first AI coding workspace`,
    description: SITE_CONFIG.description,
    url: absoluteUrl("/"),
    siteName: SITE_CONFIG.name,
    type: "website",
    images: [
      {
        url: absoluteUrl("/screenshots/mico-chat.png"),
        width: 1440,
        height: 900,
        alt: "MCP Code desktop workspace with Mico chat",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_CONFIG.name} | Local-first AI coding workspace`,
    description: SITE_CONFIG.description,
    images: [absoluteUrl("/screenshots/mico-chat.png")],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-[#0d0e12] text-[#f0f0f4] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
