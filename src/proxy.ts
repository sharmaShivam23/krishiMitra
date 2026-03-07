import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';

const locales = ['en', 'hi', 'pa'];

// 1. Setup the next-intl middleware
const intlMiddleware = createMiddleware({
  locales: locales,
  defaultLocale: 'en',
  localePrefix: 'always' // Ensures /[locale] is always present for consistent parsing
});

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 2. Define Public Assets to skip entirely
  const isPublicFile = /\.(.*)$/.test(pathname);
  if (isPublicFile) return NextResponse.next();

  // 3. Normalize Path (Remove locale to check auth logic)
  // Example: "/hi/login" -> "/login"
  const pathWithoutLocale = pathname.replace(new RegExp(`^/(${locales.join('|')})`), '') || '/';

  // 4. Extract Auth Tokens
  const farmerToken = request.cookies.get('auth_token')?.value || '';
  const adminToken = request.cookies.get('admin_token')?.value || '';

  // 5. Define Route Categories
  const isAdminPath = pathWithoutLocale.startsWith('/admin');
  const isAdminLogin = pathWithoutLocale === '/admin/login';
  const isUserAuthPath = pathWithoutLocale === '/login' || pathWithoutLocale === '/register';
  const isPublicLanding = pathWithoutLocale === '/';
  
  // Identify the current locale for redirecting
  const currentLocale = locales.find(loc => pathname.startsWith(`/${loc}`)) || 'en';

  /* ======================================================
      ADMIN AUTH LOGIC
  ====================================================== */
  if (isAdminPath) {
    // Already logged in? Don't show login page
    if (isAdminLogin && adminToken) {
      return NextResponse.redirect(new URL(`/${currentLocale}/admin/dashboard`, request.url));
    }
    // Not logged in? Force login (except on the login page itself)
    if (!isAdminLogin && !adminToken) {
      return NextResponse.redirect(new URL(`/${currentLocale}/admin/login`, request.url));
    }
  }

  /* ======================================================
      FARMER / USER AUTH LOGIC
  ====================================================== */
  // Redirect logged-in users away from /login or /register
  if (isUserAuthPath && farmerToken) {
    return NextResponse.redirect(new URL(`/${currentLocale}/dashboard`, request.url));
  }

  // Protect /dashboard and other private routes
  // We exclude the landing page, auth pages, and admin paths (handled above)
  const isProtectedRoute = !isPublicLanding && !isUserAuthPath && !isAdminPath;
  if (isProtectedRoute && !farmerToken) {
    return NextResponse.redirect(new URL(`/${currentLocale}/login`, request.url));
  }

  // 6. Final step: Let next-intl handle the response
  return intlMiddleware(request);
}

export const config = {
  // 🛠️ Matcher updated to ignore internal Next.js paths and static files
  matcher: ['/((?!api|_next|.*\\..*).*)']
};