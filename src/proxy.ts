import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';

const locales = ['en', 'hi', 'pa'];


const intlMiddleware = createMiddleware({
  locales: locales,
  defaultLocale: 'en',
  localePrefix: 'always'
});


export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

 
  if (
    pathname.includes('.') || 
    pathname.startsWith('/api') || 
    pathname.startsWith('/_next')
  ) {
    return NextResponse.next();
  }

  
  const currentLocale = locales.find(loc => pathname.startsWith(`/${loc}`)) || 'en';

  
  const pathWithoutLocale = pathname.replace(new RegExp(`^/(${locales.join('|')})`), '') || '/';

  // 4. Extract Auth Tokens
  const rawAuthToken = request.cookies.get('auth_token')?.value;
  const rawAdminToken = request.cookies.get('admin_token')?.value;

  // STRICT CHECK: Ensure tokens exist and are not broken string values
  const hasFarmerAuth = !!rawAuthToken && rawAuthToken !== 'undefined' && rawAuthToken !== 'null';
  const hasAdminAuth = !!rawAdminToken && rawAdminToken !== 'undefined' && rawAdminToken !== 'null';

  // 5. Define Route Categories
  const isAdminPath = pathWithoutLocale.startsWith('/admin');
  const isAdminLogin = pathWithoutLocale === '/admin/login';
  const isUserAuthPath = pathWithoutLocale === '/login' || pathWithoutLocale === '/register';
  const isPublicLanding = pathWithoutLocale === '/';


  if (isAdminPath) {
   
    if (isAdminLogin && hasAdminAuth) {
      return NextResponse.redirect(new URL(`/${currentLocale}/admin/dashboard`, request.url));
    }
  
    if (!isAdminLogin && !hasAdminAuth) {
      return NextResponse.redirect(new URL(`/${currentLocale}/admin/login`, request.url));
    }
  } 
  
  
  else {
   
    if (isUserAuthPath && hasFarmerAuth) {
      return NextResponse.redirect(new URL(`/${currentLocale}/dashboard`, request.url));
    }

    
    const isProtectedRoute = !isPublicLanding && !isUserAuthPath;
    if (isProtectedRoute && !hasFarmerAuth) {
      return NextResponse.redirect(new URL(`/${currentLocale}/login`, request.url));
    }
  }

  // 6. Final step: Let next-intl handle the response translation
  return intlMiddleware(request);
}

export const config = {
 
  matcher: ['/((?!api|_next|.*\\..*).*)']
};