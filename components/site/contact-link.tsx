'use client';

import type { ReactNode } from 'react';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
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

    if (
      kind === 'phone_click' &&
      googleAdsId &&
      googleAdsLabel &&
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
