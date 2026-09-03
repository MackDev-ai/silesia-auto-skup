const limited = (value: string | null | undefined, max = 500) =>
  value ? value.trim().slice(0, max) : null;

export function extractCampaignData(url: URL, referrer: string) {
  const utmSource = limited(url.searchParams.get('utm_source'), 120);
  let source = utmSource;
  if (!source && url.searchParams.get('gclid')) source = 'google_ads';
  if (!source && referrer) {
    try {
      source = new URL(referrer).hostname.slice(0, 160);
    } catch {
      source = 'referral';
    }
  }
  return {
    source: source || 'direct',
    referrer: limited(referrer, 1000),
    landingPage: limited(`${url.pathname}${url.search}`, 1500),
    utmSource,
    utmMedium: limited(url.searchParams.get('utm_medium'), 120),
    utmCampaign: limited(url.searchParams.get('utm_campaign'), 180),
    utmTerm: limited(url.searchParams.get('utm_term'), 180),
    utmContent: limited(url.searchParams.get('utm_content'), 180),
    gclid: limited(url.searchParams.get('gclid'), 250),
  };
}
