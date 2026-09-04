/* eslint-disable @next/next/next-script-for-ga -- canonical GTM head/body snippets supplied by the SEM provider */
import type { Metadata } from 'next';

import { ConsentManager } from '@/components/privacy/consent-manager';
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
            url: '/og.jpg',
            width: 1200,
            height: 675,
            alt: 'Silesia Auto Skup — ciemny samochód na industrialnym tle Śląska',
          },
        ]
      : undefined,
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: 'Sprzedaj auto szybko. Bez zbędnych formalności.',
    images: siteConfig.siteUrl ? ['/og.jpg'] : undefined,
  },
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const googleTagManagerId = siteConfig.googleTagManagerId;

  return (
    <html lang="pl">
      <head>
        <link
          rel="preload"
          as="image"
          type="image/avif"
          href="/images/hero-mobile-640.avif"
          imageSrcSet="/images/hero-mobile-640.avif 640w, /images/hero-mobile-960.avif 960w"
          imageSizes="100vw"
          media="(max-width: 639px)"
          fetchPriority="high"
        />
        <link
          rel="preload"
          as="image"
          type="image/avif"
          href="/images/hero-desktop-1280.avif"
          imageSrcSet="/images/hero-desktop-960.avif 960w, /images/hero-desktop-1280.avif 1280w, /images/hero-desktop-1672.avif 1672w"
          imageSizes="100vw"
          media="(min-width: 640px)"
          fetchPriority="high"
        />
        {googleTagManagerId && (
          <script
            id="google-tag-manager"
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${googleTagManagerId}');`,
            }}
          />
        )}
      </head>
      <body className="antialiased">
        {googleTagManagerId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${googleTagManagerId}`}
              height="0"
              width="0"
              title="Google Tag Manager"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        {children}
        <ConsentManager
          googleAnalyticsId={siteConfig.googleAnalyticsId}
          googleAdsId={siteConfig.googleAdsId}
        />
      </body>
    </html>
  );
}
