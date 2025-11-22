import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "tavs - Güven Çemberinden Tavsiyeler",
  description: "Güvendiğin insanlardan kitap, film, müzik, mekan ve teknoloji tavsiyeleri al. Kendi çemberini oluştur, tavsiyeleri paylaş.",
  keywords: ["tavsiye", "öneri", "kitap", "film", "müzik", "mekan", "teknoloji", "sosyal medya"],
  authors: [{ name: "tavs" }],
  openGraph: {
    title: "tavs - Güven Çemberinden Tavsiyeler",
    description: "Güvendiğin insanlardan kitap, film, müzik, mekan ve teknoloji tavsiyeleri al.",
    url: "https://tavs.app",
    siteName: "tavs",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "tavs - Güven Çemberinden Tavsiyeler",
    description: "Güvendiğin insanlardan kitap, film, müzik, mekan ve teknoloji tavsiyeleri al.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${inter.variable} antialiased`}
      >
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <BottomNav />
      </body>
    </html>
  );
}
