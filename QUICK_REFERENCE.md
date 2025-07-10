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
│   ├── (auth)/        # Auth group (public)
│   └── (dashboard)/   # Protected pages
├── components/        # React components
│   ├── ui/           # Base components
│   ├── emails/       # Email templates
│   └── [feature]/    # Feature components
├── lib/              # Utilities
│   ├── auth.ts       # NextAuth config
│   ├── db.ts         # Database client
│   ├── email.ts      # Email sending
│   └── stripe.ts     # Stripe config
└── types/            # TypeScript types
```

### Debug Tips

#### Common Issues
1. **Build fails**: Check TypeScript errors
2. **Auth not working**: Verify NEXTAUTH_URL and SECRET
3. **Emails not sending**: Check RESEND_API_KEY
4. **Database errors**: Verify DATABASE_URL, run migrations
5. **Stripe errors**: Check webhook secret, API keys

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

#### Avoid
- Large client-side state
- Unnecessary re-renders
- Blocking operations
- Exposed secrets
- Unhandled promise rejections

### AI Assistant Integration Notes

#### Current Setup (No AI)
- Use research docs for content
- Implement template-based generation
- Create dynamic feel without actual AI
- Prepare structure for future AI integration

#### Future AI Considerations
- OpenAI API for content generation
- Prompt templates by niche
- Rate limiting for API calls
- Caching AI responses
- Fallback to templates if AI fails

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

Last Updated: After Phase 1 Completion
Next Major Task: Phase 2 - Monetization & Paywall Implementation