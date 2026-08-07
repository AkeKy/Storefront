import React from 'react';
import type { Metadata, Viewport } from 'next';
import { DM_Sans } from 'next/font/google';
import '../styles/tailwind.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { CartProvider } from '@/features/cart/CartContext';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  applicationName: 'ByteForge',
  title: 'ByteForge — Gaming Gear & IT Tech Shop',
  description: 'ByteForge is a practical destination for gaming peripherals, GPUs, monitors, headsets, and IT gear.',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
  },
  openGraph: {
    title: 'ByteForge — Gaming Gear',
    description: 'Shop gaming peripherals, GPUs, and IT gear.',
    images: [{ url: '/assets/images/app_logo.png', width: 1200, height: 630 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} light`}>
      <body className={dmSans.className}>
        <ThemeProvider><CartProvider>{children}</CartProvider></ThemeProvider>
      </body>
    </html>
  );
}
