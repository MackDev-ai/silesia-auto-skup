'use client';

import type { ReactNode } from 'react';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __sasConsent?: { analytics: boolean; marketing: boolean };
  }
}

type Props = {
  href: string;
  kind?: 'phone_click' | 'whatsapp_click';
  className?: string;
  children: ReactNode;
  googleAdsId?: string;
  googleAdsLabel?: string;
  ariaLabel?: string;
};

export function ContactLink({
  href,
  kind,
  className,
  children,
  googleAdsId,
  googleAdsLabel,
  ariaLabel,
}: Props) {
  function handleClick() {
    if (!kind) return;
    void fetch('/api/events/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: kind }),
      keepalive: true,
    }).catch(() => undefined);

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: kind,
      contact_method: kind === 'phone_click' ? 'phone' : 'whatsapp',
      link_url: href,
      page_location: window.location.href,
      page_path: `${window.location.pathname}${window.location.search}`,
    });

    if (
      kind === 'phone_click' &&
      googleAdsId &&
      googleAdsLabel &&
      window.__sasConsent?.marketing === true &&
      typeof window.gtag === 'function'
    ) {
      window.gtag('event', 'conversion', {
        send_to: `${googleAdsId}/${googleAdsLabel}`,
      });
    }
  }

  return (
    <a href={href} className={className} onClick={handleClick} aria-label={ariaLabel}>
      {children}
    </a>
  );
}
