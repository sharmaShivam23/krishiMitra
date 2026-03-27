import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import {DEFAULT_LOCALE, SUPPORTED_LOCALES} from '@/i18n/locales';

const locales = [...SUPPORTED_LOCALES];


const intlMiddleware = createMiddleware({
  locales: locales,
  defaultLocale: DEFAULT_LOCALE,
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

  
  const currentLocale = locales.find(loc => pathname.startsWith(`/${loc}`)) || DEFAULT_LOCALE;

  
  const pathWithoutLocale = pathname.replace(new RegExp(`^/(${locales.join('|')})`), '') || '/';

  
  const rawAuthToken = request.cookies.get('auth_token')?.value;
  const rawAdminToken = request.cookies.get('admin_token')?.value;


  const hasFarmerAuth = !!rawAuthToken && rawAuthToken !== 'undefined' && rawAuthToken !== 'null';
  const hasAdminAuth = !!rawAdminToken && rawAdminToken !== 'undefined' && rawAdminToken !== 'null';


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

 
  return intlMiddleware(request);
}

export const config = {
 
  matcher: ['/((?!api|_next|.*\\..*).*)']
};