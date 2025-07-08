import NextAuth from 'next-auth';
import { NextRequest } from 'next/server';
import { authOptions } from '@/lib/auth';
import { ratelimiters, rateLimit } from '@/lib/ratelimit';

const handler = NextAuth(authOptions);

// Wrap GET requests with rate limiting
export async function GET(request: NextRequest) {
  // Apply rate limiting for auth endpoints
  const rateLimitResponse = await rateLimit(request, ratelimiters?.auth || null);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  
  return handler(request);
}

// Wrap POST requests with rate limiting
export async function POST(request: NextRequest) {
  // Apply rate limiting for auth endpoints
  const rateLimitResponse = await rateLimit(request, ratelimiters?.auth || null);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  
  return handler(request);
}