# Development Workflow & Technical Context - Creators AI Compass

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
7. **AI**: OpenAI GPT-4 API
   - Chat completions for AI mentor
   - Embeddings for knowledge base
   - Function calling for structured outputs
   - Stream processing for real-time responses

## Development Patterns

### File Organization
```
src/
├── app/                 # Next.js 13+ App Router
│   ├── api/            # API routes
│   │   └── ai/         # AI endpoints (chat, embeddings, etc)
│   ├── (auth)/         # Auth pages group
│   └── (dashboard)/    # Protected pages group
├── components/         # React components
│   ├── ui/            # Base UI components
│   ├── features/      # Feature-specific components
│   ├── ai/            # AI-specific components
│   │   ├── chat/      # Chat interface components
│   │   ├── mentor/    # AI mentor components
│   │   └── insights/  # AI insights display
│   └── onboarding/    # AI onboarding flow
├── lib/               # Utilities and configurations
│   ├── ai/            # AI service layer
│   │   ├── openai.ts  # OpenAI client configuration
│   │   ├── prompts/   # System prompts and templates
│   │   ├── knowledge/ # Knowledge base management
│   │   └── utils/     # AI utility functions
│   └── knowledge-base/ # Static knowledge files
├── hooks/             # Custom React hooks
│   └── useAI.ts       # AI-specific hooks
├── store/             # Zustand state management
│   └── ai-store.ts    # AI conversation state
└── types/             # TypeScript definitions
    └── ai.ts          # AI-specific types
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
  - OPENAI_API_KEY: For AI features
  - OPENAI_MODEL: gpt-4-turbo-preview (or specific model)
  - AI_RATE_LIMIT: Messages per minute (default: 10)
  - AI_MAX_TOKENS: Max response tokens (default: 1000)
- Production: Pulled from Vercel (production env)
  - NEXTAUTH_URL: https://creatorsaicompass.com
  - NODE_ENV: production
  - STRIPE_WEBHOOK_SECRET: For production webhook
  - OPENAI_API_KEY: For AI features
  - OPENAI_MODEL: gpt-4-turbo-preview (or specific model)
  - AI_RATE_LIMIT: Messages per minute (default: 10)
  - AI_MAX_TOKENS: Max response tokens (default: 1000)

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
6. **AI not responding**:
   - Check OPENAI_API_KEY is valid
   - Verify API quota/credits available
   - Check rate limit settings
   - Monitor error logs for specific issues
7. **AI streaming issues**:
   - Ensure proper SSE headers
   - Check for proxy/CDN interference
   - Verify client-side EventSource handling
8. **AI context problems**:
   - Check conversation history storage
   - Verify context token limits
   - Ensure proper session management

### Recovery Procedures
- **Rollback**: Revert commit and force push
- **Database issues**: Check Neon dashboard
- **Environment issues**: Re-pull with `vercel env pull`
- **Cache issues**: Clear .next folder and rebuild

---

## AI Implementation Workflows

### AI Development Setup
1. **Environment Configuration**:
   ```bash
   # Add to .env.local
   OPENAI_API_KEY=sk-proj-...
   OPENAI_MODEL=gpt-4-turbo-preview
   AI_RATE_LIMIT=10
   AI_MAX_TOKENS=1000
   AI_TEMPERATURE=0.7
   ```

2. **Testing AI Features**:
   - **Local Testing**:
     - Set OPENAI_API_KEY in .env.local
     - Test streaming responses with SSE
     - Monitor token usage in console
     - Use AI playground at /dashboard/ai-playground
   
   - **Development Testing**:
     - Test on dev.creatorsaicompass.com
     - Monitor AI conversation persistence
     - Check rate limiting behavior
     - Test error handling for API limits

### Updating AI Prompts
1. **System Prompts**:
   ```typescript
   // lib/ai/prompts/system.ts
   export const SYSTEM_PROMPTS = {
     mentor: `You are an AI mentor for content creators...`,
     analyzer: `You analyze content performance...`,
     ideaGenerator: `You help generate content ideas...`
   }
   ```

2. **Prompt Testing**:
   ```bash
   # Test prompts locally
   npm run test:prompts
   
   # Validate prompt tokens
   npm run validate:prompts
   ```

3. **Prompt Deployment**:
   - Update prompt files in `lib/ai/prompts/`
   - Test with various inputs
   - Monitor response quality
   - Deploy to preview first

### AI Service Debugging
```bash
# Check AI service logs
vercel logs --follow --filter ai

# Test AI endpoints
curl -X POST https://dev.creatorsaicompass.com/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SESSION_TOKEN" \
  -d '{"message": "Hello AI", "context": "onboarding"}'

# Test streaming endpoint
curl -X POST https://dev.creatorsaicompass.com/api/ai/stream \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SESSION_TOKEN" \
  -d '{"message": "Generate content ideas"}' \
  --no-buffer
```

### Knowledge Base Management
1. **Adding Knowledge**:
   ```bash
   # Add new knowledge document
   cp new-doc.md docs/knowledge-base/
   
   # Generate embeddings
   npm run knowledge:embed
   
   # Update vector database
   npm run knowledge:sync
   ```

2. **Knowledge Updates**:
   - Update documents in `docs/knowledge-base/`
   - Run embedding generation
   - Test semantic search
   - Verify AI responses use new knowledge

3. **Knowledge Testing**:
   ```bash
   # Test knowledge retrieval
   npm run knowledge:test "query string"
   
   # Validate knowledge consistency
   npm run knowledge:validate
   ```

### AI Monitoring & Analytics
1. **Token Usage Tracking**:
   ```typescript
   // Track in database
   await prisma.aiUsage.create({
     data: {
       userId,
       tokens: response.usage.total_tokens,
       model: 'gpt-4-turbo-preview',
       type: 'chat'
     }
   })
   ```

2. **Performance Monitoring**:
   - Response time tracking
   - Error rate monitoring
   - Token consumption per user
   - API rate limit tracking

3. **Cost Analysis**:
   ```bash
   # Generate AI cost report
   npm run ai:cost-report --month 2024-03
   
   # Check user AI usage
   npm run ai:user-usage --userId user_123
   ```

### AI Feature Testing
1. **Unit Tests**:
   ```bash
   # Test AI utilities
   npm run test:ai
   
   # Test prompt generation
   npm run test:prompts
   ```

2. **Integration Tests**:
   ```bash
   # Test AI endpoints
   npm run test:ai-api
   
   # Test streaming responses
   npm run test:streaming
   ```

3. **E2E Tests**:
   - Test complete AI conversations
   - Verify context persistence
   - Test rate limiting
   - Validate error handling

### AI Error Handling
1. **API Errors**:
   ```typescript
   try {
     const response = await openai.chat.completions.create({...})
   } catch (error) {
     if (error.code === 'rate_limit_exceeded') {
       // Handle rate limit
     } else if (error.code === 'insufficient_quota') {
       // Handle quota exceeded
     }
   }
   ```

2. **Fallback Strategies**:
   - Cache frequent responses
   - Use simpler models for non-critical tasks
   - Implement graceful degradation
   - Show helpful error messages

### AI Deployment Considerations
1. **API Key Security**:
   - Never expose keys in client code
   - Use server-side API routes only
   - Implement request validation
   - Monitor for unusual usage

2. **Rate Limiting**:
   ```typescript
   // Implement per-user rate limits
   const rateLimiter = new RateLimiter({
     windowMs: 60 * 1000, // 1 minute
     max: process.env.AI_RATE_LIMIT || 10
   })
   ```

3. **Cost Management**:
   - Set usage alerts in OpenAI dashboard
   - Implement daily/monthly limits per user
   - Use cheaper models for simple tasks
   - Cache common responses

4. **Performance Optimization**:
   - Stream responses for better UX
   - Implement request queuing
   - Use edge functions where possible
   - Optimize prompt length

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

# Add OpenAI configuration
echo "sk-proj-..." | vercel env add OPENAI_API_KEY production
echo "sk-proj-..." | vercel env add OPENAI_API_KEY preview
echo "gpt-4-turbo-preview" | vercel env add OPENAI_MODEL production
echo "gpt-4-turbo-preview" | vercel env add OPENAI_MODEL preview
echo "10" | vercel env add AI_RATE_LIMIT production
echo "20" | vercel env add AI_RATE_LIMIT preview
echo "1000" | vercel env add AI_MAX_TOKENS production
echo "2000" | vercel env add AI_MAX_TOKENS preview

# Pull latest
vercel env pull .env.local
```

## AI-Specific Commands

### Development
```bash
# Test AI locally
npm run dev:ai

# Generate embeddings for knowledge base
npm run ai:embed

# Validate AI prompts
npm run ai:validate-prompts

# Test AI responses
npm run ai:test-responses
```

### Monitoring
```bash
# Check AI usage
npm run ai:usage --period="7d"

# Monitor AI costs
npm run ai:costs --month="2024-03"

# View AI error logs
vercel logs --filter="ai-error"
```

### Deployment
```bash
# Deploy with AI feature flags
vercel --build-env AI_FEATURES=enabled

# Deploy with specific model
vercel --build-env OPENAI_MODEL=gpt-4-turbo-preview
```

---

This document serves as my primary reference for development workflow and should be consulted when starting any new task or troubleshooting issues.