import type { NextConfig } from 'next';

import { applicationSecurityHeaders } from './security-headers';

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: Object.entries(applicationSecurityHeaders).map(([key, value]) => ({ key, value })),
      },
    ];
  },
};

export default nextConfig;
