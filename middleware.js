import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export function middleware(request) {
  const token = request.cookies.get('token')?.value;

  // Define protected routes
  const protectedRoutes = ['/admin', '/superadmin', '/employee'];
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute && !token) {
    // Redirect to login if no token
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Role-based route protection
      const pathname = request.nextUrl.pathname;
      
      if (pathname.startsWith('/superadmin') && decoded.role !== 'SuperAdmin') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      
      if (pathname.startsWith('/admin') && 
          decoded.role !== 'Admin' && 
          decoded.role !== 'SuperAdmin') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }

      // Token is valid, continue
      return NextResponse.next();
      
    } catch (error) {
      // Invalid token, redirect to login
      console.error('Middleware token verification failed:', error.message);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/superadmin/:path*',
    '/employee/:path*',
    '/api/admin/:path*',
  ]
};
