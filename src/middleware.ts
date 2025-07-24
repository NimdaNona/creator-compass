import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimitEdge, formatRateLimitHeaders, createRateLimitError, type RateLimitType } from "@/lib/redis-ratelimit-edge";

// Determine rate limit type based on path
function getRateLimitType(pathname: string): RateLimitType | null {
  if (pathname.startsWith('/api/health')) return null; // No rate limit
  if (pathname.startsWith('/api/stripe/webhook')) return 'webhook';
  if (pathname.startsWith('/api/auth')) return 'auth';
  if (pathname.startsWith('/api/ai')) return 'ai';
  if (pathname.startsWith('/api/templates')) return 'template';
  if (pathname.startsWith('/api/stripe') || pathname.startsWith('/api/checkout')) return 'stripe';
  if (pathname.startsWith('/api/export')) return 'export';
  return 'general'; // Default rate limit
}

// Main middleware function that combines auth and rate limiting
async function mainMiddleware(req: NextRequest, token: any) {
  const { pathname } = req.nextUrl;

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api')) {
    const rateLimitType = getRateLimitType(pathname);
    
    if (rateLimitType) {
      // Use IP address or user ID as identifier
      const identifier = token?.email || 
        req.headers.get('x-forwarded-for') || 
        req.headers.get('x-real-ip') || 
        'anonymous';
      
      const rateLimitResult = await checkRateLimitEdge(rateLimitType, identifier);
      
      if (!rateLimitResult.success) {
        return NextResponse.json(
          createRateLimitError(rateLimitResult),
          {
            status: 429,
            headers: formatRateLimitHeaders(rateLimitResult)
          }
        );
      }
      
      // Add rate limit headers to successful responses
      const response = NextResponse.next();
      const headers = formatRateLimitHeaders(rateLimitResult);
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
    }
  }

  // Allow access to public routes
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/auth') ||
    pathname === '/' ||
    pathname.startsWith('/pricing') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/offline') ||
    pathname.startsWith('/manifest') ||
    pathname.startsWith('/icon') ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    pathname.startsWith('/sw.js') ||
    pathname.startsWith('/api/ai/test-db') || // Allow test endpoint
    pathname.startsWith('/api/test-db-simple') || // Allow simple test
    pathname.startsWith('/api/test-db-direct') || // Allow direct test
    pathname.startsWith('/api/test-inline') || // Allow inline test
    pathname.startsWith('/api/ai/chat-test') || // Allow chat test
    pathname.startsWith('/api/ai/conversations') || // Allow conversations endpoint
    pathname.startsWith('/api/ai/chat-simple') || // Allow simple chat endpoint
    pathname.startsWith('/api/ai/test-minimal') || // Allow minimal test endpoint
    pathname.startsWith('/api/test-db') || // Allow any test-db endpoint
    pathname.startsWith('/api/public-test') || // Allow public test endpoint
    pathname.startsWith('/api/ai/chat-v2') || // Allow new chat endpoint
    pathname.startsWith('/api/ai/test-cache') || // Allow cache test endpoint
    pathname.startsWith('/api/ai/test-conversation-flow') || // Allow flow test endpoint
    pathname.startsWith('/api/ai/test-db-conversation') // Allow db conversation test endpoint
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

  // Allow access to all authenticated routes
  // Onboarding check will be handled at the page level
  return NextResponse.next();
}

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token;
    return mainMiddleware(req as NextRequest, token);
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
          pathname.startsWith('/onboarding') ||
          pathname.startsWith('/_next') ||
          pathname.startsWith('/favicon') ||
          pathname.startsWith('/offline') ||
          pathname.startsWith('/manifest') ||
          pathname.startsWith('/icon') ||
          pathname === '/sitemap.xml' ||
          pathname === '/robots.txt' ||
          pathname.startsWith('/sw.js') ||
          pathname.startsWith('/api/stripe/webhook') || // Allow webhook access
          pathname.startsWith('/api/ai/chat') || // Allow AI chat for onboarding
          pathname.startsWith('/api/ai/test-db') || // Allow test endpoint
          pathname.startsWith('/api/test-db-direct') || // Allow direct test
          pathname.startsWith('/api/test-db-simple') || // Allow simple test
          pathname.startsWith('/api/test-inline') || // Allow inline test
          pathname.startsWith('/api/ai/chat-test') || // Allow chat test
          pathname.startsWith('/api/ai/conversations') || // Allow conversations endpoint
          pathname.startsWith('/api/ai/chat-simple') || // Allow simple chat endpoint
          pathname.startsWith('/api/ai/test-minimal') || // Allow minimal test endpoint
          pathname.startsWith('/api/test-db') || // Allow any test-db endpoint
          pathname.startsWith('/api/public-test') || // Allow public test endpoint
          pathname.startsWith('/api/ai/chat-v2') || // Allow new chat endpoint
          pathname.startsWith('/api/ai/test-cache') || // Allow cache test endpoint
          pathname.startsWith('/api/ai/test-conversation-flow') || // Allow flow test endpoint
          pathname.startsWith('/api/ai/test-db-conversation') // Allow db conversation test endpoint
        ) {
          return true;
        }

        // For protected routes, require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * 
     * Now includes API routes for rate limiting
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};