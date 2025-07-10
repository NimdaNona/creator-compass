# Development Workflow & Technical Context

## Role & Responsibilities

### Claude Code (Me) - Full Stack AI Engineer
- **Primary Role**: Complete autonomous development, from planning to implementation
- **Capabilities**: 
  - Full codebase access and modification
  - Git operations (branching, commits, pushes)
  - Vercel CLI for deployments and environment management
  - Prisma for database operations
  - NPM for package management
  - Direct file system access
  - Web research and documentation review

### Human Bridge (You)
- **Primary Role**: Strategic direction and platform access
- **Responsibilities**:
  - Providing API keys and credentials
  - Accessing external platforms (Google Console, Stripe Dashboard, etc.)
  - Strategic decisions and clarifications
  - Testing deployed features
  - Granting permissions when needed

## Dual-Environment Setup

### Overview
We maintain two separate environments for development and production:

1. **Production Environment**
   - URL: https://creatorsaicompass.com
   - Branch: main
   - Vercel Environment: Production
   - Purpose: Live application for end users

2. **Development Environment**
   - URL: https://dev.creatorsaicompass.com
   - Branch: develop
   - Vercel Environment: Preview
   - Purpose: Testing new features before production

### Environment-Specific Configurations

#### Google OAuth
Both environments configured in Google Cloud Console:
- Production redirect: https://creatorsaicompass.com/api/auth/callback/google
- Development redirect: https://dev.creatorsaicompass.com/api/auth/callback/google

#### Stripe Webhooks
Separate webhook endpoints for each environment:
- Production: https://creatorsaicompass.com/api/stripe/webhook
- Development: https://dev.creatorsaicompass.com/api/stripe/webhook
- Code automatically uses correct webhook secret based on NODE_ENV

#### Email Configuration
Resend configured to work with both domains:
- Emails sent from: noreply@creatorsaicompass.com
- Links in emails use appropriate domain based on NEXTAUTH_URL

### Testing Workflow
1. Develop and test locally with `npm run dev`
2. Push to develop branch for dev environment testing
3. Test thoroughly at dev.creatorsaicompass.com
4. When ready, merge develop to main for production deployment

## Git & Deployment Workflow

### Branch Strategy
```
main (production)
  └── develop (preview/staging)
       └── feature branches (optional, for complex features)
```

### Current Workflow
1. **Development**: All work happens on `develop` branch
2. **Testing**: Automatic deployment to Vercel preview on push
3. **Production**: Merge `develop` to `main` when ready

### Commands I Use
```bash
# Check current branch
git branch

# Create and switch to develop
git checkout -b develop

# Stage and commit changes
git add -A
git commit -m "Descriptive message

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to GitHub (triggers Vercel deployment)
git push origin develop

# Deploy to preview manually
vercel

# Deploy to production
vercel --prod

# Pull environment variables
vercel env pull .env.local
```

## Environment & Infrastructure

### Local Development
- **Working Directory**: `/mnt/c/Projects/CreatorCompass/creator-compass`
- **Node Version**: Latest LTS
- **Package Manager**: npm
- **Development Server**: `npm run dev` (runs on port 3000)

### Vercel Configuration
- **Project**: creator-compass
- **Team**: sterling-cliftons-projects
- **Production Domain**: creatorsaicompass.com (main branch)
- **Development Domain**: dev.creatorsaicompass.com (develop branch)
- **Preview Pattern**: creator-compass-*.vercel.app

### Database (Neon)
- **Provider**: Neon (Serverless Postgres) via Vercel
- **Access**: Via POSTGRES_PRISMA_URL (pooled) and POSTGRES_URL_NON_POOLING (direct)
- **ORM**: Prisma
- **Migrations**: `npx prisma db push` (for now)
- **Client Generation**: `npx prisma generate`
- **Important**: Vercel Postgres uses specific env vars for Prisma integration

### Key Services
1. **Authentication**: NextAuth.js
2. **Email**: Resend SMTP
3. **Payments**: Stripe
4. **Cache/Rate Limiting**: Upstash Redis (KV)
5. **Hosting**: Vercel
6. **Database**: Neon Postgres

## Development Patterns

### File Organization
```
src/
├── app/                 # Next.js 13+ App Router
│   ├── api/            # API routes
│   ├── (auth)/         # Auth pages group
│   └── (dashboard)/    # Protected pages group
├── components/         # React components
│   ├── ui/            # Base UI components
│   └── features/      # Feature-specific components
├── lib/               # Utilities and configurations
├── hooks/             # Custom React hooks
├── store/             # Zustand state management
└── types/             # TypeScript definitions
```

### Code Standards
- **TypeScript**: Strict mode enabled
- **Styling**: Tailwind CSS with custom theme
- **Components**: Shadcn/UI as base
- **State**: Zustand for client state
- **Forms**: React Hook Form (when needed)
- **Validation**: Zod schemas

### Testing Approach
1. **Local Testing**: Run dev server and test manually
2. **Preview Testing**: Deploy to Vercel preview
3. **Type Checking**: `npm run typecheck`
4. **Linting**: `npm run lint`
5. **Build Testing**: `npm run build`

## Common Operations

### Adding New Features
1. Create feature on `develop` branch
2. Update schema if needed: `npx prisma db push`
3. Implement API routes first
4. Build UI components
5. Test locally
6. Commit and push for preview
7. Test on preview URL
8. Merge to main when ready

### Updating Environment Variables
1. Add to `.env.local` for local testing
2. Add to Vercel dashboard (you handle this)
3. Pull latest with `vercel env pull`

### Database Changes
1. Update `prisma/schema.prisma`
2. Push changes: `npx prisma db push`
3. Generate client: `npx prisma generate`
4. Update affected code

## Important Notes

### Security Considerations
- Never commit `.env.local`
- Use environment variables for all secrets
- Implement proper authentication checks
- Validate all user inputs
- Use CSRF protection (built into NextAuth)

### Performance Guidelines
- Use dynamic imports for large components
- Implement proper caching strategies
- Optimize images with Next.js Image
- Use server components where possible
- Minimize client-side state

### Error Handling
- Always use try-catch in API routes
- Provide user-friendly error messages
- Log errors for debugging (without sensitive data)
- Use error boundaries for UI components

## Debugging Tools

### Logs & Monitoring
- Local: Console logs during development
- Vercel: Function logs in dashboard
- Build logs: Visible during deployment

### Database Inspection
- Prisma Studio: `npx prisma studio`
- Direct queries: Via Neon dashboard

### API Testing
- Local: Use browser or curl
- Preview/Prod: Test with actual domain

## Quick Reference

### Start Development
```bash
npm run dev
```

### Deploy to Preview
```bash
git add -A && git commit -m "Changes" && git push origin develop
```

### Deploy to Production
```bash
git checkout main && git merge develop && git push origin main
```

### Update Database Schema
```bash
npx prisma db push && npx prisma generate
```

### Check Type Errors
```bash
npm run typecheck
```

### Fix Linting Issues
```bash
npm run lint
```

## CI/CD Pipeline

### Automatic Deployments
- **Push to develop** → Preview deployment
- **Push to main** → Production deployment
- **PR creation** → Preview deployment with unique URL

### Build Process
1. Install dependencies
2. Generate Prisma client
3. Build Next.js application
4. Run type checking (if configured)
5. Deploy to Vercel edge network

### Environment Variables
- Development: `.env.local`
- Preview: Pulled from Vercel (preview env)
  - NEXTAUTH_URL: https://dev.creatorsaicompass.com
  - NODE_ENV: development
  - STRIPE_WEBHOOK_SECRET_DEV: For dev webhook endpoint
- Production: Pulled from Vercel (production env)
  - NEXTAUTH_URL: https://creatorsaicompass.com
  - NODE_ENV: production
  - STRIPE_WEBHOOK_SECRET: For production webhook

## Troubleshooting

### Common Issues
1. **Build failures**: Check type errors and missing dependencies
2. **Database connection**: 
   - Vercel Postgres uses POSTGRES_PRISMA_URL not DATABASE_URL
   - Ensure Prisma schema has both url and directUrl configured
   - Error "column does not exist" means schema not synced
3. **Auth not working**: 
   - Check NEXTAUTH_URL (dev.creatorsaicompass.com for preview, creatorsaicompass.com for production)
   - Verify NEXTAUTH_SECRET is set
   - Ensure Google OAuth has correct redirect URIs for both environments
4. **Emails not sending**: Verify RESEND_API_KEY
5. **Payments failing**: Check Stripe keys and webhook setup

### Recovery Procedures
- **Rollback**: Revert commit and force push
- **Database issues**: Check Neon dashboard
- **Environment issues**: Re-pull with `vercel env pull`
- **Cache issues**: Clear .next folder and rebuild

---

## Phase 2 Specific Workflows

### Creating Stripe Prices
```bash
# Use the script for creating prices
node scripts/create-yearly-prices.js

# Or use Stripe CLI directly
curl -X POST https://api.stripe.com/v1/prices \
  -u "$STRIPE_SECRET_KEY:" \
  -d "product=prod_id" \
  -d "unit_amount=9900" \
  -d "currency=usd" \
  -d "recurring[interval]=year"
```

### Testing Subscription Flows
1. **Local Testing**:
   - Use Stripe test mode (sk_test_*)
   - Test cards: 4242424242424242
   - Webhook testing: stripe listen --forward-to localhost:3000/api/stripe/webhook

2. **Development Testing**:
   - Use live mode with small amounts
   - Test on dev.creatorsaicompass.com
   - Monitor webhook logs in Stripe dashboard

### Database Migrations for Phase 2
```bash
# Add new fields to schema
# Edit prisma/schema.prisma

# Push changes to database
npx prisma db push

# Generate new client
npx prisma generate
```

### Paywall Implementation Pattern
```typescript
// Consistent pattern for all premium features
import { SubscriptionGate } from '@/components/subscription/SubscriptionGate';

<SubscriptionGate feature="analytics" fallback={<PaywallBanner />}>
  <AnalyticsDashboard />
</SubscriptionGate>
```

### Environment Variable Updates
```bash
# Add to Vercel
echo "value" | vercel env add KEY_NAME production
echo "value" | vercel env add KEY_NAME preview

# Pull latest
vercel env pull .env.local
```

---

This document serves as my primary reference for development workflow and should be consulted when starting any new task or troubleshooting issues.