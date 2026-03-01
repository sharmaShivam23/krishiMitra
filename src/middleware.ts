import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Extract tokens
  const farmerToken = request.cookies.get('auth_token')?.value || '';
  const adminToken = request.cookies.get('admin_token')?.value || '';

  // 2. Define Route Categories
  const isAdminPath = path.startsWith('/admin');
  const isSetupPath = path === '/admin/setup';
  const isAdminLogin = path === '/admin/login';
  
  const isUserAuthPath = path === '/login' || path === '/register';
  const isPublicLanding = path === '/';

  /* ======================================================
      ADMIN ROUTING LOGIC
  ====================================================== */
  if (isAdminPath) {
    // ALWAYS allow the setup page so you can create the first admin
    if (isSetupPath) return NextResponse.next();

    // If logged-in admin tries to access login -> Send to dashboard
    if (isAdminLogin && adminToken) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    // If accessing protected admin route without token -> Send to admin login
    if (!isAdminLogin && !adminToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    return NextResponse.next();
  }

  /* ======================================================
      FARMER / STANDARD USER ROUTING LOGIC
  ====================================================== */
  
  // If a farmer is logged in and tries to hit /login or /register -> Send to dashboard
  if (isUserAuthPath && farmerToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If the path is NOT public (not login, register, or landing) and NO token -> Send to login
  const isProtectedUserPath = !isUserAuthPath && !isPublicLanding;
  
  if (isProtectedUserPath && !farmerToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap, robots (metadata)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};