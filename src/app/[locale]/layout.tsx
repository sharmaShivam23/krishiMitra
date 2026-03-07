import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "KrishiMitra",
  description: "Empowering the Modern Farmer",
};

const locales = ['en', 'hi', 'pa'];

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  // 🛠️ FIX: Next.js 15+ requires params to be a Promise in Layouts
  params: Promise<{ locale: string }>; 
}) {
  // 🛠️ FIX: Await the params to get the active language from the URL
  const { locale } = await params;

  if (!locales.includes(locale as any)) notFound();

  const messages = await getMessages();

return (
    <html lang={locale} suppressHydrationWarning>
      {/* 🛠️ FIX: Added suppressHydrationWarning to the body tag */}
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900`}
        suppressHydrationWarning
      >
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}