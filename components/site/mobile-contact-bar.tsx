'use client';

import { Phone } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ContactLink } from '@/components/site/contact-link';

type Props = {
  href: string;
  phoneEnabled: boolean;
  companyName: string;
  googleAdsId?: string;
  googleAdsLabel?: string;
};

export function MobileContactBar({
  href,
  phoneEnabled,
  companyName,
  googleAdsId,
  googleAdsLabel,
}: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sections = ['start', 'kontakt']
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));

    if (!sections.length || !('IntersectionObserver' in window)) return;

    const intersections = new Map<Element, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          intersections.set(entry.target, entry.isIntersecting);
        }
        setVisible(!sections.some((section) => intersections.get(section)));
      },
      { threshold: 0.08 },
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  return (
    <ContactLink
      href={href}
      kind={phoneEnabled ? 'phone_click' : undefined}
      googleAdsId={googleAdsId}
      googleAdsLabel={googleAdsLabel}
      className="mobile-contact-bar fixed left-1/2 z-50 flex h-12 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center justify-center gap-2 rounded-full border border-white/15 bg-[#111210]/95 px-5 text-sm font-black text-white shadow-2xl shadow-black/35 backdrop-blur-md lg:hidden"
      ariaLabel={
        phoneEnabled
          ? `Zadzwoń do ${companyName}`
          : 'Przejdź do sekcji kontaktowej'
      }
    >
      {phoneEnabled ? 'Zadzwoń teraz' : 'Skontaktuj się'}
      <Phone className="size-4 text-amber-400" />
    </ContactLink>
  );
}
