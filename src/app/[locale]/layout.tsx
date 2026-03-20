import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import "../globals.css";
import FloatingVoiceAssistant from "@/components/FloatingVoiceAssistant";

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

const locales = [
  'en', 'hi', 'pa', 'mr', 'bn', 'te', 'ta',
  'as', 'gu', 'kn', 'ml', 'or', 'ur', 'sa', 'sd',
  'ne', 'mai', 'doi', 'gom', 'sat', 'ks', 'mni'
];

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>; 
}) {
  
  const { locale } = await params;

  if (!locales.includes(locale as any)) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900`}
        suppressHydrationWarning
      >
        <NextIntlClientProvider messages={messages}>
          {children}
          {/* Voice Assistant is now globally available across all pages */}
          <FloatingVoiceAssistant />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}