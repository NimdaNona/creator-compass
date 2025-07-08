import NextAuth from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { ratelimiters, rateLimit } from '@/lib/ratelimit';

const handler = NextAuth(authOptions);

// Wrap GET requests with rate limiting
export async function GET(request: NextRequest, context: { params: { nextauth: string[] } }) {
  // Skip rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return handler.GET(request, context);
  }
  
  // Apply rate limiting for auth endpoints in production
  try {
    const rateLimitResponse = await rateLimit(request, ratelimiters?.auth || null);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  } catch (error) {
    // If rate limiting fails, continue without it
    console.warn('Rate limiting failed:', error);
  }
  
  return handler.GET(request, context);
}

// Wrap POST requests with rate limiting
export async function POST(request: NextRequest, context: { params: { nextauth: string[] } }) {
  // Skip rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return handler.POST(request, context);
  }
  
  // Apply rate limiting for auth endpoints in production
  try {
    const rateLimitResponse = await rateLimit(request, ratelimiters?.auth || null);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  } catch (error) {
    // If rate limiting fails, continue without it
    console.warn('Rate limiting failed:', error);
  }
  
  return handler.POST(request, context);
}