'use client';

import { OPEN_COOKIE_SETTINGS_EVENT } from '@/lib/privacy-consent';

type Props = {
  className?: string;
};

export function CookieSettingsButton({ className }: Props) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))}
    >
      Ustawienia cookies
    </button>
  );
}

