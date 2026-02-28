import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Extract BOTH tokens from cookies
  const farmerToken = request.cookies.get('auth_token')?.value || '';
  const adminToken = request.cookies.get('admin_token')?.value || '';

  /* ======================================================
     1. ADMIN ROUTING LOGIC
  ====================================================== */
  if (path.startsWith('/admin')) {
    // If an admin tries to go to the login page but is already logged in
    if (path === '/admin/login' && adminToken) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    
    // If someone tries to access a protected admin route (like /admin/dashboard) without an admin token
    if (path !== '/admin/login' && !adminToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // If checks pass, let them through the admin portal
    return NextResponse.next();
  }

  /* ======================================================
     2. FARMER / STANDARD USER ROUTING LOGIC
  ====================================================== */
  const isPublicUserPath = path === '/login' || path === '/register' || path === '/';

  // If a farmer tries to go to login/register but is already logged in
  if ((path === '/login' || path === '/register') && farmerToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If someone tries to access a protected farmer route (like /dashboard) without a farmer token
  if (!isPublicUserPath && !farmerToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  /* ======================================================
     3. ALLOW ALL OTHER VALID REQUESTS
  ====================================================== */
  return NextResponse.next();
}

// Configure the matcher to specify exactly which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};