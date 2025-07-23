# Phase 1.3: Comprehensive Rate Limiting Strategy

## Goals
1. Prevent API abuse and ensure fair usage
2. Be generous enough to not impact legitimate users
3. Different limits for different user tiers
4. Clear error messages when limits are hit
5. Use Upstash Redis for distributed rate limiting

## Rate Limit Tiers

### Free Tier (Most Generous)
- **General API**: 300 requests per minute (5 req/sec)
- **AI Chat**: 30 requests per minute
- **Template Generation**: 20 requests per minute
- **Authentication**: 10 requests per minute
- **Stripe Operations**: 10 requests per minute
- **Export Operations**: 10 requests per minute

### Pro Tier (Very Generous)
- **General API**: 600 requests per minute (10 req/sec)
- **AI Chat**: 60 requests per minute
- **Template Generation**: 40 requests per minute
- **Authentication**: 20 requests per minute
- **Stripe Operations**: 20 requests per minute
- **Export Operations**: 30 requests per minute

### Studio Tier (Extremely Generous)
- **General API**: 1200 requests per minute (20 req/sec)
- **AI Chat**: 120 requests per minute
- **Template Generation**: 80 requests per minute
- **Authentication**: 30 requests per minute
- **Stripe Operations**: 30 requests per minute
- **Export Operations**: 60 requests per minute

### Public/Unauthenticated
- **Health Check**: Unlimited
- **Static Assets**: Unlimited
- **Auth Endpoints**: 5 requests per minute
- **Webhooks**: 1000 requests per minute

## Implementation Strategy

### 1. Rate Limiter Types
```typescript
// Sliding window for smooth rate limiting
const rateLimiters = {
  general: { window: '1m', maxRequests: based_on_tier },
  ai: { window: '1m', maxRequests: based_on_tier },
  auth: { window: '1m', maxRequests: based_on_tier },
  stripe: { window: '1m', maxRequests: based_on_tier },
  export: { window: '1m', maxRequests: based_on_tier },
  webhook: { window: '1m', maxRequests: 1000 }
}
```

### 2. Identifier Strategy
- **Authenticated**: Use user ID for accurate per-user limiting
- **Unauthenticated**: Use IP address with caution
- **Webhooks**: Use webhook signature or source

### 3. Error Response Format
```json
{
  "error": "Rate limit exceeded",
  "message": "You've made too many requests. Please slow down.",
  "limit": 300,
  "remaining": 0,
  "reset": "2024-01-01T00:01:00Z",
  "retryAfter": 45
}
```

### 4. Headers to Include
- `X-RateLimit-Limit`: Total requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: When the limit resets
- `Retry-After`: Seconds until next request allowed

### 5. Special Considerations
- **Burst Protection**: Allow short bursts but prevent sustained abuse
- **Grace Period**: Warn users at 80% usage before hard limiting
- **Webhook Exemption**: Stripe webhooks need higher limits
- **Development Mode**: More lenient limits in development

## Routes to Protect

### High Priority (Expensive Operations)
1. `/api/ai/chat` - AI API calls cost money
2. `/api/templates/generate` - AI generation
3. `/api/export/*` - Resource intensive
4. `/api/analytics` - Database heavy

### Medium Priority (User Operations)
1. `/api/user/*` - Profile updates
2. `/api/progress/*` - Progress tracking
3. `/api/achievements/*` - Achievement tracking
4. `/api/resources/*` - Resource access

### Low Priority (Read Operations)
1. `/api/templates` - Template listing
2. `/api/notifications` - Notification checks
3. `/api/usage` - Usage stats

### Exempt from Rate Limiting
1. `/api/health` - Health checks
2. `/api/stripe/webhook` - Payment webhooks (different limits)
3. Static assets and public pages

## Implementation Notes

1. **Use Upstash Redis** for distributed rate limiting across Vercel instances
2. **Graceful Degradation**: Fall back to in-memory if Redis is unavailable
3. **Monitoring**: Log rate limit hits for analysis
4. **User Experience**: Show remaining limits in UI for transparency
5. **Testing**: Ensure limits don't break normal user workflows