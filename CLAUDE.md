# CreatorCompass - Claude Code Documentation

## Project Overview

CreatorCompass is a comprehensive creator growth platform built with Next.js 15, designed to help content creators on YouTube, TikTok, and Twitch grow their audience through structured 90-day roadmaps, gamification, and platform-specific guidance.

**Production Deployment:**
- **Live Site**: https://creatorsaicompass.com
- **Hosting**: Vercel (integrated with GitHub)
- **Repository**: GitHub with automatic deployments
- **Domain**: creatorsaicompass.com

**Key Technologies:**
- Next.js 15 with App Router and TypeScript
- Prisma ORM with PostgreSQL (Neon via Vercel)
- NextAuth.js for authentication (Google OAuth and Email/Password)
- Zustand for state management with database persistence
- Tailwind CSS with Shadcn/UI components
- Stripe for payments and subscriptions
- Upstash Redis for rate limiting (Vercel KV)

## Quick Start Commands

### Development
```bash
# Start development server
npm run dev

# Database operations
npx prisma db push
npx prisma studio

# Build and lint
npm run build
npm run lint
npm run typecheck
```

### Production Deployment
- Automatic deployment via Vercel when pushing to GitHub
- Environment variables configured in Vercel dashboard
- Database managed via Vercel Postgres (Neon)

## Architecture Overview

### Directory Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── templates/         # Template generators
│   ├── platform-tools/    # Platform-specific tools
│   ├── resources/         # Resource library
│   ├── achievements/      # Achievement system
│   ├── pricing/           # Pricing and subscriptions
│   └── api/               # API routes
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── dashboard/         # Dashboard components
│   ├── engagement/        # Gamification system
│   ├── layout/            # Layout components (Header, etc.)
│   ├── platform-features/ # Platform-specific features
│   ├── resources/         # Resource components
│   ├── templates/         # Template components
│   ├── ui/                # Shadcn/UI components
│   └── providers/         # Context providers
├── lib/                   # Utility functions
├── store/                 # Zustand state management
└── types/                 # TypeScript definitions
```

### Key Components

**Authentication System:**
- NextAuth.js with Google OAuth (production)

- Protected routes via middleware
- Session-based authentication

**Database Layer:**
- Prisma ORM with PostgreSQL (Neon)
- Production database via Vercel Postgres
- User profiles, progress tracking, achievements
- Database utilities in `src/lib/db.ts`

**State Management:**
- Zustand stores with local persistence
- App state and user-specific state separation
- Authentication state management

**UI System:**
- Shadcn/UI components with Tailwind CSS
- Responsive design with mobile-first approach
- Custom design system with CSS variables
- Error boundaries for production stability

## Production Environment Setup

### Environment Variables (.env.local)
```bash
# Application Configuration
NODE_ENV="production"
NEXTAUTH_URL="https://creatorsaicompass.com"
NEXTAUTH_SECRET="production-secret-key"

# Database (Vercel Postgres - Neon)
DATABASE_URL="postgres://neondb_owner:..."

# OAuth Providers
GOOGLE_CLIENT_ID="920464094401-..."
GOOGLE_CLIENT_SECRET="GOCSPX-..."

# Email Configuration (Resend SMTP)
RESEND_API_KEY="your-resend-api-key"

# Stripe (Production Live Keys)
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Stripe Product IDs
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID="price_1Riea4G48MbDPfJlHADqH4iP"
NEXT_PUBLIC_STRIPE_STUDIO_PRICE_ID="price_1RieesG48MbDPfJlKCv1X4hS"

# Redis (Upstash - Vercel KV)
KV_REST_API_URL="https://valued-gator-38769.upstash.io"
KV_REST_API_TOKEN="AZdxAAIjcD..."
```

### Database Setup
```bash
# Push schema to production database
npx prisma db push

# View production database
npx prisma studio
```

## Core Features

### 1. Platform Support
- **YouTube**: Channel optimization, content planning, analytics
- **TikTok**: Short-form content strategies, trending topics
- **Twitch**: Streaming setup, community building, monetization

### 2. Template Generators
- Content planning templates
- Platform-specific content formats
- Automated template generation with customization

### 3. Resource Library
- Curated resources for content creators
- Platform-specific guides and tools
- Downloadable assets and templates

### 4. Achievement System
- Progress tracking with badges and rewards
- Gamification to encourage engagement
- Visual celebration system

### 5. Platform Tools
- Specialized tools for each platform
- Analytics and optimization features
- Growth tracking and recommendations

### 6. Subscription Management
- Stripe integration for payments
- Multiple subscription tiers
- Automatic billing and plan management

## Authentication Flow

### Production Authentication
1. Users visit protected routes
2. Middleware redirects to `/auth/signin` if not authenticated
3. OAuth flow with Google or Email/Password
4. Successful authentication redirects to intended page
5. Session persisted via NextAuth.js

### Route Protection
- Public routes: `/`, `/pricing`, `/auth/*`
- Protected routes: `/dashboard`, `/templates`, `/platform-tools`, `/resources`, `/achievements`
- Middleware handles automatic redirects

## Common Production Issues & Solutions

### 1. OAuth Configuration
**Issue**: OAuth buttons not showing
**Solution**: Configure OAuth providers in environment variables and NextAuth.js config

### 2. Protected Route 500 Errors
**Issue**: Authentication required for API calls
**Solution**: Ensure proper session handling in API routes and components

### 3. Environment Variables
**Issue**: Missing or incorrect environment variables
**Solution**: Verify all required variables in Vercel dashboard

### 4. Database Connection
**Issue**: Database connection failures
**Solution**: Check DATABASE_URL and Neon database status

## Deployment Process

### Automatic Deployment
1. Push changes to GitHub repository
2. Vercel automatically detects changes
3. Builds and deploys to production
4. Environment variables from Vercel dashboard
5. Database migrations via Prisma

### Manual Deployment Steps
```bash
# 1. Commit changes
git add .
git commit -m "Description of changes"
git push origin main

# 2. Vercel automatically deploys
# 3. Monitor deployment in Vercel dashboard
# 4. Test production site at creatorsaicompass.com
```

## Troubleshooting

### Common Production Issues
1. **OAuth not working**: Check provider configuration in Vercel environment variables
2. **Database errors**: Verify Neon database connection and Prisma schema
3. **404 errors**: Ensure all routes are properly configured
4. **API failures**: Check authentication middleware and error handling

### Development vs Production Differences
- No mock authentication in production
- Real OAuth providers required
- PostgreSQL instead of SQLite
- Environment variables from Vercel dashboard
- HTTPS required for OAuth callbacks

### Debugging Steps
1. Check Vercel deployment logs
2. Verify environment variables in Vercel dashboard
3. Test authentication flow manually
4. Check database connectivity via Prisma Studio
5. Monitor error boundaries and client-side exceptions

## File Locations

### Key Configuration Files
- `next.config.ts` - Next.js configuration
- `prisma/schema.prisma` - Database schema
- `src/lib/auth.ts` - NextAuth.js configuration
- `src/middleware.ts` - Route protection middleware
- `package.json` - Dependencies and scripts

### Important Component Files
- `src/components/layout/Header.tsx` - Navigation with auth state
- `src/app/pricing/page.tsx` - Subscription management
- `src/app/auth/signin/page.tsx` - Authentication page
- `src/components/ui/error-boundary.tsx` - Error handling

## Security Considerations

### Production Security
- HTTPS enforced via Vercel
- Secure OAuth implementation
- Environment variables not exposed to client
- Stripe webhook signature verification
- CSRF protection via NextAuth.js

### Data Protection
- User data encrypted in PostgreSQL
- No sensitive data in client-side code
- Proper session management
- Rate limiting via Upstash Redis

This documentation reflects the current production deployment on Vercel with the creatorsaicompass.com domain.