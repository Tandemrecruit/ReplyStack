import { DM_Sans, JetBrains_Mono } from "next/font/google";

import "./globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Replily | AI-Powered Review Responses",
    template: "%s | Replily",
  },
  description:
    "Respond to every Google Business review in 30 seconds with AI that sounds like you. Built for local businesses.",
  keywords: [
    "review management",
    "Google Business Profile",
    "AI responses",
    "local business",
    "reputation management",
  ],
  authors: [{ name: "Replily" }],
  creator: "Replily",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://replily.com",
    siteName: "Replily",
    title: "Replily | AI-Powered Review Responses",
    description:
      "Respond to every Google Business review in 30 seconds with AI that sounds like you.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Replily | AI-Powered Review Responses",
    description:
      "Respond to every Google Business review in 30 seconds with AI that sounds like you.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${dmSans.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
