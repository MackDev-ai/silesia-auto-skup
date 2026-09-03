import type { Metadata } from 'next';
import Script from 'next/script';

import { siteConfig } from '@/lib/config';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: siteConfig.siteUrl ? new URL(siteConfig.siteUrl) : undefined,
  title: `${siteConfig.name} — skup aut i samochodów na Śląsku`,
  description:
    'Skup samochodów na Śląsku: auta sprawne, uszkodzone i powypadkowe. Indywidualna wycena, możliwość odbioru pojazdu i minimum formalności.',
  keywords: [
    'skup aut Śląsk',
    'skup samochodów Śląsk',
    'skup aut Katowice',
    'skup aut Zabrze',
    'skup samochodów uszkodzonych Śląsk',
    'sprzedaż samochodu Śląsk',
    'skup aut powypadkowych Śląsk',
  ],
  alternates: siteConfig.siteUrl ? { canonical: siteConfig.siteUrl } : undefined,
  robots: { index: true, follow: true },
  openGraph: {
    title: siteConfig.name,
    description: 'Sprzedaj auto szybko. Bez zbędnych formalności.',
    locale: 'pl_PL',
    type: 'website',
    images: siteConfig.siteUrl
      ? [
          {
            url: '/og.png',
            width: 1672,
            height: 941,
            alt: 'Silesia Auto Skup — ciemny samochód na industrialnym tle Śląska',
          },
        ]
      : undefined,
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: 'Sprzedaj auto szybko. Bez zbędnych formalności.',
    images: siteConfig.siteUrl ? ['/og.png'] : undefined,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className="antialiased">
        {children}
        {siteConfig.googleAdsId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(siteConfig.googleAdsId)}`}
              strategy="afterInteractive"
            />
            <Script id="google-ads-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${siteConfig.googleAdsId.replace(/[^A-Z0-9-]/gi, '')}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
