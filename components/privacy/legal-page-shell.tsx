import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { CookieSettingsButton } from '@/components/privacy/cookie-settings-button';
import { siteConfig } from '@/lib/config';

type Props = {
  eyebrow: string;
  title: string;
  lead: string;
  children: ReactNode;
};

export function LegalPageShell({ eyebrow, title, lead, children }: Props) {
  return (
    <main className="min-h-screen bg-[#f7f7f3] text-[#111210]">
      <header className="border-b border-black/10 bg-[#111210] px-5 py-5 text-white sm:px-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3" aria-label="Wróć na stronę główną">
            <span className="grid size-10 place-items-center rounded-full bg-amber-400 text-xs font-black text-black">
              SAS
            </span>
            <span className="max-w-36 text-sm font-extrabold uppercase leading-[0.95] text-amber-400">
              {siteConfig.name}
            </span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-white/70 hover:text-white">
            <ArrowLeft className="size-4" /> Strona główna
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#747a6d]">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl text-[clamp(2.5rem,8vw,5.5rem)] font-black uppercase leading-[0.9] tracking-[-0.06em]">
          {title}
        </h1>
        <p className="mt-7 max-w-3xl text-lg leading-8 text-[#60665c]">{lead}</p>
        <p className="mt-4 text-sm font-bold text-[#73786f]">Ostatnia aktualizacja: 4 września 2026 r.</p>

        <div className="legal-content mt-12">{children}</div>
      </article>

      <footer className="bg-[#111210] px-5 py-8 text-sm text-white/55 sm:px-8">
        <div className="mx-auto flex max-w-4xl flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} {siteConfig.name}</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-3" aria-label="Dokumenty i ustawienia prywatności">
            <a className="hover:text-white" href="/polityka-prywatnosci">Polityka prywatności</a>
            <a className="hover:text-white" href="/polityka-cookies">Polityka cookies</a>
            <CookieSettingsButton className="text-left hover:text-white" />
          </nav>
        </div>
      </footer>
    </main>
  );
}
