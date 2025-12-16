import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReplyStack - AI-Powered Review Responses",
  description: "Respond to Google reviews in seconds with AI that sounds like you.",
};

/**
 * Root application layout that wraps page content in an <html> and <body> and applies the global font and antialias styles.
 *
 * @param children - The React nodes to render inside the document body.
 * @returns The root JSX element containing the HTML structure with applied global typography and antialiasing.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}