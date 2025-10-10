import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_COOKIE_NAME = 'rudy-admin-auth';
const ADMIN_COOKIE_VALUE = 'authenticated';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Protect all /admin routes (except /admin-login)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin-login')) {
    const adminCookie = request.cookies.get(ADMIN_COOKIE_NAME);
    
    // If not authenticated, redirect to login
    if (!adminCookie || adminCookie.value !== ADMIN_COOKIE_VALUE) {
      const loginUrl = new URL('/admin-login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  // If authenticated and trying to access /admin-login, redirect to dashboard
  if (pathname.startsWith('/admin-login')) {
    const adminCookie = request.cookies.get(ADMIN_COOKIE_NAME);
    
    if (adminCookie && adminCookie.value === ADMIN_COOKIE_VALUE) {
      const dashboardUrl = new URL('/admin/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }
  
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: ['/admin/:path*', '/admin-login'],
};

