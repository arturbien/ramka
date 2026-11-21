import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ramka/react'],
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
        // The example shipped as "Moodboard" before being renamed for what it
        // actually showcases. `:path*` matches zero segments too, so both the
        // grid URL and every photo deep link redirect.
        source: '/examples/lightbox/moodboard/:path*',
        destination: '/examples/lightbox/url-synced-state/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
