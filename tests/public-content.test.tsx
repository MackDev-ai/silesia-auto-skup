import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import Home from '@/app/page';

describe('public one-page', () => {
  it('renders the essential content without browser JavaScript or public forms', () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain('Sprzedaj auto');
    expect(html).toContain('Dane kontaktowe w przygotowaniu');
    expect(html).toContain('Katowice');
    expect(html).not.toContain('<form');
    expect(html).not.toContain('Numer telefonu</label>');
  });

  it('includes the mobile sticky contact control and responsive image hints', () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain('mobile-contact-bar fixed inset-x-4');
    expect(html).toContain('sizes="100vw"');
  });
});
