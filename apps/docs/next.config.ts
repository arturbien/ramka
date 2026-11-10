import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ramka/react'],
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
      { source: '/docs/framework/react', destination: '/docs', permanent: false },
      { source: '/docs/framework/react/lightbox/:path*', destination: '/docs/lightbox/:path*', permanent: false },
      { source: '/docs/framework/react/presets/:path*', destination: '/presets/:path*', permanent: false },
      { source: '/docs/framework/react/examples/:path*', destination: '/examples/:path*', permanent: false },
    ];
  },
};

export default nextConfig;
