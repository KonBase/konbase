import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logDebug } from '@/utils/debug'; // Import the debug logger

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const requestedPath = req.nextUrl.pathname;
  logDebug(
    'Middleware: Processing request',
    { path: requestedPath, sessionExists: !!session },
    'info',
  );

  // Protect routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/inventory',
    '/conventions',
    '/admin',
    '/settings',
  ];
  const isProtectedRoute = protectedRoutes.some((route) =>
    requestedPath.startsWith(route),
  );

  logDebug(
    'Middleware: Route protection check',
    {
      path: requestedPath,
      isProtectedRoute,
      sessionExists: !!session,
    },
    'info',
  );

  if (isProtectedRoute && !session) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', requestedPath);
    logDebug(
      'Middleware: Redirecting to login',
      { from: requestedPath, to: redirectUrl.toString() },
      'warn',
    );
    return NextResponse.redirect(redirectUrl);
  }

  logDebug(
    'Middleware: Allowing request',
    { path: requestedPath, sessionExists: !!session },
    'info',
  );
  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
