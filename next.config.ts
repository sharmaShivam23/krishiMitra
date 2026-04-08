import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const securityHeaders = [
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Prevent clickjacking
  { key: 'X-Frame-Options', value: 'DENY' },
  // XSS filter (legacy browsers)
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Referrer leakage prevention
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Feature restrictions
  { key: 'Permissions-Policy', value: 'microphone=(), camera=()' },
  // HSTS – force HTTPS for 2 years
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Scripts: allow self + Next.js inline + Cloudinary widget
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://widget.cloudinary.com https://upload-widget.cloudinary.com",
      // Styles: allow self + inline (Tailwind)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Images: allow self + Cloudinary + Unsplash + data URIs
      "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://www.transparenttextures.com",
      // API connections
      "connect-src 'self' https://api.cloudinary.com https://geocoding-api.open-meteo.com https://api.open-meteo.com https://enam.gov.in https://api.bigdatacloud.net",
      // Media (Sarvam TTS returns data URLs)
      "media-src 'self' data: blob:",
      // Frames: block all
      "frame-src 'none'",
      // Object embeds: block all
      "object-src 'none'",
      // Base URI: only self
      "base-uri 'self'",
      // Form submissions: self only
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  output: 'standalone',

  // Attach security headers to every page + API response
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  // Disable X-Powered-By leaking Next.js version
  poweredByHeader: false,
};

export default withNextIntl(nextConfig);