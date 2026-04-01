import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/i18n/locales';
import { rateLimitCheck, RateLimitPresets } from '@/lib/rateLimit';

const locales = [...SUPPORTED_LOCALES];

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    (req as any).ip ||
    'unknown'
  );
}

function rateLimitedResponse(resetAt: number): NextResponse {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  return new NextResponse(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        'X-RateLimit-Reset': new Date(resetAt).toUTCString(),
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      },
    }
  );
}

// Auth routes that get tighter limits
const AUTH_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/send-otp',
  '/api/auth/verify',
];

// Sensitive routes (call, OTP, etc.)
const SENSITIVE_PATHS = [
  '/api/request-call',
  '/api/auth/send-otp',
];

// AI routes
const AI_PATHS = [
  '/api/crops',
  '/api/mandi-advice',
  '/api/disease-detection',
  '/api/crop-lifecycle',
];

// ─── Middleware ───────────────────────────────────────────────────────────────

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIP(request);
  const origin = request.headers.get('origin');

  // ── Static / Next internals — skip completely ──
  if (
    pathname.includes('.') ||
    pathname.startsWith('/_next')
  ) {
    return NextResponse.next();
  }

  // ── API routes — rate limiting + CORS only ──
  if (pathname.startsWith('/api')) {
    // Block requests from disallowed origins in production
    if (
      process.env.NODE_ENV === 'production' &&
      origin &&
      process.env.ALLOWED_ORIGINS
    ) {
      const allowed = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
      if (!allowed.includes(origin)) {
        return new NextResponse(
          JSON.stringify({ error: 'CORS: Origin not allowed.' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Select rate limit preset based on route
    let preset = RateLimitPresets.api;
    if (SENSITIVE_PATHS.some(p => pathname.startsWith(p))) {
      preset = RateLimitPresets.sensitive;
    } else if (AUTH_PATHS.some(p => pathname.startsWith(p))) {
      preset = RateLimitPresets.auth;
    } else if (AI_PATHS.some(p => pathname.startsWith(p))) {
      preset = RateLimitPresets.ai;
    }

    const rl = rateLimitCheck(`${ip}:${pathname}`, preset);
    if (!rl.success) {
      return rateLimitedResponse(rl.resetAt);
    }

    // Add rate-limit info headers to all API responses
    const res = NextResponse.next();
    res.headers.set('X-RateLimit-Remaining', String(rl.remaining));
    res.headers.set('X-RateLimit-Reset', new Date(rl.resetAt).toUTCString());
    return res;
  }

  // ── Page routes — auth guard + i18n ──
  const currentLocale = locales.find(loc => pathname.startsWith(`/${loc}`)) || DEFAULT_LOCALE;
  const pathWithoutLocale = pathname.replace(new RegExp(`^/(${locales.join('|')})`), '') || '/';

  const rawAuthToken = request.cookies.get('auth_token')?.value;
  const rawAdminToken = request.cookies.get('admin_token')?.value;

  const hasFarmerAuth = !!rawAuthToken && rawAuthToken !== 'undefined' && rawAuthToken !== 'null';
  const hasAdminAuth = !!rawAdminToken && rawAdminToken !== 'undefined' && rawAdminToken !== 'null';

  const isAdminPath = pathWithoutLocale.startsWith('/admin');
  const isAdminLogin = pathWithoutLocale === '/admin/login';
  const isUserAuthPath = pathWithoutLocale === '/login' || pathWithoutLocale === '/register' || pathWithoutLocale === '/forgot-password';
  const isPublicLanding = pathWithoutLocale === '/';

  if (isAdminPath) {
    if (isAdminLogin && hasAdminAuth) {
      return NextResponse.redirect(new URL(`/${currentLocale}/admin/dashboard`, request.url));
    }
    if (!isAdminLogin && !hasAdminAuth) {
      return NextResponse.redirect(new URL(`/${currentLocale}/admin/login`, request.url));
    }
  } else {
    if (isUserAuthPath && hasFarmerAuth) {
      return NextResponse.redirect(new URL(`/${currentLocale}/dashboard`, request.url));
    }
    const isProtectedRoute = !isPublicLanding && !isUserAuthPath;
    if (isProtectedRoute && !hasFarmerAuth) {
      return NextResponse.redirect(new URL(`/${currentLocale}/login`, request.url));
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)', '/api/:path*'],
};