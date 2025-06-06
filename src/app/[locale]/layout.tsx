
import type { Metadata } from 'next';
import { Inter as Geist, Inter as Geist_Mono } from 'next/font/google';
import '../globals.css'; 
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/AuthContext';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server'; 
import {notFound} from 'next/navigation';
import type { ReactNode } from 'react';
import { locales } from '@/i18n'; // defaultLocale is not needed here

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}

export const metadata: Metadata = {
  title: 'MediAdmin',
  description: 'Medical Administration Panel',
};

interface RootLayoutProps {
  children: ReactNode;
  params: {locale: string};
}

export default async function LocaleLayout({
  children,
  params: {locale}
}: RootLayoutProps) {
  // Validate that the incoming `locale` parameter is valid
  const isValidLocale = locales.includes(locale as any);
  if (!isValidLocale) {
    console.error(`[layout.tsx] Invalid locale detected in params: "${locale}". Expected one of: ${locales.join(', ')}. Calling notFound().`);
    notFound();
  }

  let messages;
  try {
    // getMessages should infer the locale from the request context (params.locale)
    messages = await getMessages(); 
  } catch (error) {
    // This catch block should ideally not be hit if i18n.ts has fallbacks or handles errors by calling notFound() itself.
    // However, if getMessages() itself throws before i18n.ts can execute fully.
    console.error(`[layout.tsx] Error calling getMessages() for locale "${locale}":`, error);
    notFound();
  }

  // It's possible getMessages succeeds but returns undefined/null if i18n.ts misbehaves without throwing.
  if (!messages) {
    // This check is important because if messages is undefined, NextIntlClientProvider will error.
    console.error(`[layout.tsx] getMessages() for locale "${locale}" returned no messages. This might indicate an issue in i18n.ts or the message file itself. Calling notFound().`);
    notFound();
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

