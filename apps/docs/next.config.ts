import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ramka/react'],
  // Dev only: lets phones on a local network load the dev server's scripts
  // (Next blocks cross-origin dev resources by default). Covers the private
  // IPv4 ranges (10/8, 172.16/12, 192.168/16) and mDNS `.local` hostnames.
  // No effect in production.
  allowedDevOrigins: [
    '10.*.*.*',
    ...Array.from({ length: 16 }, (_, i) => `172.${16 + i}.*.*`),
    '192.168.*.*',
    '*.local',
  ],
  images: {
    // Every optimized image comes from a static import with a content-hashed
    // URL, so it never changes. The 4-hour default made the CDN drop variants
    // and re-read them from Vercel's image cache, which is billed per read.
    minimumCacheTTL: 60 * 60 * 24 * 31,
    // Next's defaults minus 750 and 2048, which sit within ~10% of 640/828
    // and 1920: each extra width is another variant to cache and read.
    deviceSizes: [640, 828, 1080, 1200, 1920, 3840],
  },
  async redirects() {
    return [
      {
        // www serves a second full copy of the site, and Google indexes it
        // (splitting ranking signals across two hosts). 308 everything to
        // the apex, which is the canonical origin in `app/_content/site.ts`.
        source: '/:path*',
        has: [{ type: 'host', value: 'www.ramka.dev' }],
        destination: 'https://ramka.dev/:path*',
        permanent: true,
      },
      {
        // Shipped as "Moodboard", then "URL-synced state", before Shareable
        // albums replaced it. Photo deep links had numeric ids that don't
        // exist there, so every path lands on the album list.
        source: '/examples/lightbox/:old(moodboard|url-synced-state)/:path*',
        destination: '/examples/lightbox/shareable-albums',
        permanent: true,
      },
      {
        // Shipped as "Text message", which described the UI rather than the
        // one-Root-for-many-galleries pattern it demonstrates.
        source: '/examples/lightbox/text-message',
        destination: '/examples/lightbox/shared-lightbox',
        permanent: true,
      },
      {
        source: '/examples/lightbox/text-message.md',
        destination: '/examples/lightbox/shared-lightbox.md',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
