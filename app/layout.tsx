import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Silesian Auto Skup — skup samochodów na Śląsku',
  description:
    'Szybka i uczciwa wycena auta, płatność od ręki i bezpłatny odbiór na terenie całego województwa śląskiego.',
  openGraph: {
    title: 'Silesian Auto Skup',
    description: 'Sprzedaj auto. Bez zbędnych formalności.',
    locale: 'pl_PL',
    type: 'website',
    images: [
      {
        url: '/og.png',
        width: 1731,
        height: 909,
        alt: 'Silesian Auto Skup — sprzedaj auto bez zbędnych formalności',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Silesian Auto Skup',
    description: 'Sprzedaj auto. Bez zbędnych formalności.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
