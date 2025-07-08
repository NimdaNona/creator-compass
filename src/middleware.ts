import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Check if we're in development mode with mock auth enabled
function isMockAuthEnabled() {
  return process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
}

// Handle mock authentication
function handleMockAuth(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
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

  // Check for mock session cookie
  const mockSession = req.cookies.get('mock-session');
  
  if (!mockSession) {
    // Redirect to home page if not authenticated
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // For mock auth, redirect to onboarding for protected routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/achievements') || pathname.startsWith('/resources')) {
    const url = req.nextUrl.clone();
    url.pathname = '/onboarding';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export default function middleware(req: NextRequest) {
  // Use mock auth in development
  if (isMockAuthEnabled()) {
    return handleMockAuth(req);
  }

  // Use NextAuth middleware in production
  return withAuth(
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

      // Redirect to onboarding if user hasn't completed setup
      if (token && !pathname.startsWith('/onboarding')) {
        // Check if user has completed onboarding (you can add more sophisticated logic here)
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

          // Require authentication for all other routes
          return !!token;
        },
      },
    }
  )(req);
}

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