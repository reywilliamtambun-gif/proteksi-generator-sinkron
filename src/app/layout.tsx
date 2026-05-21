import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistem Proteksi pada Generator Sinkron - Media Pembelajaran Interaktif",
  description: "Website media pembelajaran interaktif tentang sistem proteksi pada generator sinkron untuk mata kuliah Proteksi Sistem Tenaga Listrik. Dilengkapi simulasi gangguan, kuis interaktif, kalkulator relay, dan diagram SVG.",
  keywords: ["proteksi generator", "generator sinkron", "relay proteksi", "kode ANSI", "simulasi gangguan", "proteksi sistem tenaga listrik"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
