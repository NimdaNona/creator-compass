import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Allow access to public routes
    if (
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/auth') ||
      pathname === '/' ||
      pathname.startsWith('/pricing') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon') ||
      pathname.startsWith('/offline')
    ) {
      return NextResponse.next();
    }

    // Redirect to sign-in for protected routes if not authenticated
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = '/auth/signin';
      url.searchParams.set('callbackUrl', req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // Redirect to onboarding if user hasn't completed setup
    if (token && !pathname.startsWith('/onboarding')) {
      // Check if user has completed onboarding
      const hasCompletedOnboarding = token.profile?.selectedPlatform;
      
      if (!hasCompletedOnboarding) {
        const url = req.nextUrl.clone();
        url.pathname = '/onboarding';
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Allow access to public routes without authentication
        if (
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/auth') ||
          pathname === '/' ||
          pathname.startsWith('/pricing') ||
          pathname.startsWith('/_next') ||
          pathname.startsWith('/favicon') ||
          pathname.startsWith('/offline')
        ) {
          return true;
        }

        // For protected routes, require authentication
        // This will redirect to sign-in automatically
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - some are protected at route level)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};