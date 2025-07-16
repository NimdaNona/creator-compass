# Quick Reference Guide - Creators AI Compass

## Essential Commands & Operations

### Daily Development Start
```bash
# 1. Check current branch
git branch

# 2. Ensure on develop
git checkout develop

# 3. Pull latest changes
git pull origin develop

# 4. Start dev server
npm run dev

# 5. Open Prisma Studio (if needed)
npx prisma studio
```

### Before Making Changes
1. **ALWAYS** read relevant files completely
2. Research documentation if needed
3. Plan implementation thoroughly
4. Test locally before committing

### Common Tasks Quick Reference

#### Add New API Route
```typescript
// src/app/api/[route-name]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Implementation
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

#### Add Protected Page
```typescript
// Check middleware.ts for route protection
// Page will automatically redirect if not authenticated
```

#### Update Database Schema
```bash
# 1. Edit prisma/schema.prisma
# 2. Push changes
npx prisma db push --accept-data-loss
# 3. Generate client
npx prisma generate
```

#### Deploy to Preview
```bash
git add -A
git commit -m "Description of changes

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin develop
```

### Environment Variables

#### Required Variables
- `DATABASE_URL` - Neon PostgreSQL
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - Random secret
- `GOOGLE_CLIENT_ID` - OAuth credentials
- `GOOGLE_CLIENT_SECRET` - OAuth secret
- `RESEND_API_KEY` - Email service
- `STRIPE_SECRET_KEY` - Payment processing
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Client-side Stripe
- `STRIPE_WEBHOOK_SECRET` - Webhook verification
- `OPENAI_API_KEY` - OpenAI API for content generation

#### Access in Code
```typescript
// Server-side only
process.env.SECRET_KEY

// Client-side (must start with NEXT_PUBLIC_)
process.env.NEXT_PUBLIC_KEY
```

### Testing Checklist

#### Before Committing
- [ ] Run `npm run typecheck`
- [ ] Run `npm run lint`
- [ ] Run `npm run build`
- [ ] Test all affected features locally
- [ ] Check console for errors
- [ ] Test AI features if modified

#### AI Testing
- [ ] Test content generation with valid prompts
- [ ] Verify error handling for failed AI calls
- [ ] Check rate limiting functionality
- [ ] Test fallback to templates when AI unavailable
- [ ] Verify AI response caching
- [ ] Test prompt injection prevention
- [ ] Check AI usage tracking and limits

#### Authentication Testing
- [ ] Sign up with email
- [ ] Verify email link works
- [ ] Sign in with email/password
- [ ] Sign in with Google
- [ ] Password reset flow
- [ ] Session persistence
- [ ] Protected route access

#### Payment Testing
- [ ] Stripe checkout flow
- [ ] Webhook handling
- [ ] Subscription status updates
- [ ] Billing portal access
- [ ] Free tier limitations

### Important URLs

#### Development
- Local: http://localhost:3000
- Preview: Check Vercel dashboard or git push output
- Production: https://creatorsaicompass.com

#### External Services
- Stripe Dashboard: https://dashboard.stripe.com
- Resend Dashboard: https://resend.com
- Neon Dashboard: https://console.neon.tech
- Vercel Dashboard: https://vercel.com

### File Structure Reminders

```
src/
├── app/                # Pages and API routes
│   ├── api/           # API endpoints
│   │   └── ai/       # AI generation endpoints
│   ├── (auth)/        # Auth group (public)
│   └── (dashboard)/   # Protected pages
├── components/        # React components
│   ├── ui/           # Base components
│   ├── emails/       # Email templates
│   ├── ai/           # AI-related components
│   └── [feature]/    # Feature components
├── lib/              # Utilities
│   ├── auth.ts       # NextAuth config
│   ├── db.ts         # Database client
│   ├── email.ts      # Email sending
│   ├── stripe.ts     # Stripe config
│   ├── openai.ts     # OpenAI client setup
│   └── ai/           # AI utilities
│       ├── prompts.ts # Prompt templates
│       └── limits.ts  # Rate limiting
└── types/            # TypeScript types
    └── ai.ts         # AI-related types
```

### Debug Tips

#### Common Issues
1. **Build fails**: Check TypeScript errors
2. **Auth not working**: Verify NEXTAUTH_URL and SECRET
3. **Emails not sending**: Check RESEND_API_KEY
4. **Database errors**: Verify DATABASE_URL, run migrations
5. **Stripe errors**: Check webhook secret, API keys
6. **AI not generating**: Check OPENAI_API_KEY, rate limits
7. **AI errors**: Verify API quota, check error logs
8. **Slow AI responses**: Check caching, optimize prompts

#### Useful Debugging
```typescript
// Add to any server component/route
console.log('Debug:', { variable });

// Check session in pages
const session = await getServerSession(authOptions);
console.log('Session:', session);

// Database queries
const result = await db.user.findMany();
console.log('Users:', result);

// AI debugging
console.log('AI Request:', { prompt, model, temperature });
console.log('AI Response:', { usage, choices });
console.log('Rate Limit Status:', { remaining, reset });
```

### Git Workflows

#### Feature Development
```bash
# Option 1: Work directly on develop
git checkout develop
# Make changes
git add -A && git commit -m "Feature: description"
git push origin develop

# Option 2: Feature branch (for complex features)
git checkout -b feature/feature-name
# Make changes
git add -A && git commit -m "Feature: description"
git push origin feature/feature-name
# Create PR to develop
```

#### Emergency Fixes
```bash
# If something breaks in production
git checkout main
git checkout -b hotfix/fix-name
# Make fix
git add -A && git commit -m "Hotfix: description"
git push origin hotfix/fix-name
# Create PR to main AND develop
```

### Deployment Process

#### To Preview (Automatic)
- Push to `develop` branch
- Vercel deploys automatically
- Check deployment URL in Vercel dashboard

#### To Production
```bash
git checkout main
git merge develop
git push origin main
# Vercel deploys to production automatically
```

### Performance Considerations

#### Always Consider
- Image optimization (use next/image)
- Lazy loading for heavy components
- Database query optimization
- Proper caching strategies
- Error boundaries for stability
- AI response streaming for better UX
- Token usage optimization in prompts
- Batch AI requests when possible

#### Avoid
- Large client-side state
- Unnecessary re-renders
- Blocking operations
- Exposed secrets
- Unhandled promise rejections
- Synchronous AI calls in UI
- Storing API keys client-side
- Unlimited AI generation loops

### AI Assistant Integration Notes

#### Current AI Setup
- OpenAI GPT-4 for content generation
- Dynamic prompt templates by niche
- Redis-based rate limiting per user/tier
- Response caching to reduce API calls
- Fallback to template content on errors

#### AI Commands & Usage
```bash
# Test AI generation locally
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test", "type": "content_idea"}'

# Clear AI cache (development)
npm run cache:clear

# Monitor AI usage
npm run ai:stats
```

#### AI Configuration
```typescript
// lib/ai/config.ts
export const AI_CONFIG = {
  model: 'gpt-4-turbo-preview',
  temperature: 0.7,
  maxTokens: 2000,
  rateLimits: {
    free: { requests: 10, window: '24h' },
    pro: { requests: 100, window: '24h' },
    agency: { requests: 1000, window: '24h' }
  }
};
```

#### AI Prompt Management
- Prompts stored in `lib/ai/prompts/`
- Organized by content type and niche
- Include system prompts for consistency
- Version controlled for A/B testing

#### AI Error Handling
```typescript
// Always wrap AI calls in try-catch
try {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'user', content: prompt }],
  });
} catch (error) {
  if (error.code === 'rate_limit_exceeded') {
    // Handle rate limit
  } else if (error.code === 'insufficient_quota') {
    // Handle quota issues
  } else {
    // Fallback to template
  }
}
```

#### AI Monitoring Commands
```bash
# Check AI API status
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Test specific prompt
npm run ai:test -- --prompt "Create content idea" --type "youtube"

# View AI usage stats
npm run ai:usage -- --period "7d"

# Debug AI responses
NODE_ENV=development npm run dev # Enables AI debug logging
```

### User Communication

#### Email Templates
- Use React Email components
- Test with preview in browser
- Always include unsubscribe option
- Keep subject lines under 50 chars

#### Error Messages
- User-friendly language
- Actionable next steps
- No technical jargon
- Contact support option

### Monitoring & Analytics

#### What to Track
- User signups and activation
- Feature usage by tier
- Conversion funnel metrics
- Error rates and types
- Performance metrics

#### Where to Check
- Vercel Analytics (basic)
- Database queries for usage
- Stripe for revenue metrics
- Error logs in Vercel Functions

---

## Remember: ALWAYS Be Thorough
1. Research extensively before implementing
2. Read all relevant code and documentation
3. Test thoroughly at each stage
4. Document important decisions
5. Consider edge cases and error states

## When Stuck
1. Check existing patterns in codebase
2. Review documentation (this and others)
3. Search for similar implementations
4. Test in isolation first
5. Ask for clarification if needed

---

Last Updated: After AI Integration
Current Status: AI-powered content generation fully implemented