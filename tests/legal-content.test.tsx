import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import CookiePolicyPage from '@/app/polityka-cookies/page';
import PrivacyPolicyPage from '@/app/polityka-prywatnosci/page';

describe('legal information pages', () => {
  it('explains the controller, traffic monitoring and user rights', () => {
    const html = renderToStaticMarkup(<PrivacyPolicyPage />);
    expect(html).toContain('Administrator danych');
    expect(html).toContain('Własny monitoring bezpieczeństwa');
    expect(html).toContain('Google Analytics');
    expect(html).toContain('Prawa użytkownika');
  });

  it('lists necessary and optional cookies and explains CMP withdrawal', () => {
    const html = renderToStaticMarkup(<CookiePolicyPage />);
    expect(html).toContain('sas_visit_id');
    expect(html).toContain('_ga');
    expect(html).toContain('platforma CMP');
    expect(html).toContain('Consent Mode v2');
  });
});
