import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import Script from 'next/script'

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nextbike Analytics",
  description: "Analyze your Nextbike ride history with detailed statistics, visualizations, and insights. 100% client-side • No backend • No cookies • Your data stays in your browser",
  openGraph: {
    title: "Nextbike Analytics",
    description: "Analyze your Nextbike ride history with detailed statistics, visualizations, and insights. 100% client-side • No backend • No cookies • Your data stays in your browser",
    type: "website",
    siteName: "Nextbike Analytics",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
      <Script strategy="lazyOnload" src="https://cloud.umami.is/script.js" data-website-id="261e18f7-59f7-4664-bf66-f73c07cc648c" />
    </html>
  );
}
