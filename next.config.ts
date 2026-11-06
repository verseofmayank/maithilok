import type { NextConfig } from 'next';
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];
const config: NextConfig = {
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  outputFileTracingRoot: process.cwd(),
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  images: { formats: ['image/avif', 'image/webp'], minimumCacheTTL: 2678400 },
  async headers() {
    return [
      { source: '/(.*)', headers: securityHeaders },
      {
        source: '/:dir(products|categories|banners|branding|icons)/:file*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
    ];
  },
  async redirects() {
    return [{ source: '/our-story', destination: '/about', permanent: true }];
  },
};
export default config;
