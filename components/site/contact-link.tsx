'use client';

import type { ReactNode } from 'react';

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

type Props = {
  href: string;
  kind?: 'phone_click' | 'whatsapp_click';
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
};

export function ContactLink({
  href,
  kind,
  className,
  children,
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

  }

  return (
    <a href={href} className={className} onClick={handleClick} aria-label={ariaLabel}>
      {children}
    </a>
  );
}
