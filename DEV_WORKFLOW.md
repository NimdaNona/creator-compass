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
- **Production Domain**: creatorsaicompass.com
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
- Preview: Pulled from Vercel (development env)
- Production: Pulled from Vercel (production env)

## Troubleshooting

### Common Issues
1. **Build failures**: Check type errors and missing dependencies
2. **Database connection**: 
   - Vercel Postgres uses POSTGRES_PRISMA_URL not DATABASE_URL
   - Ensure Prisma schema has both url and directUrl configured
   - Error "column does not exist" means schema not synced
3. **Auth not working**: Check NEXTAUTH_URL and NEXTAUTH_SECRET
4. **Emails not sending**: Verify RESEND_API_KEY
5. **Payments failing**: Check Stripe keys and webhook setup

### Recovery Procedures
- **Rollback**: Revert commit and force push
- **Database issues**: Check Neon dashboard
- **Environment issues**: Re-pull with `vercel env pull`
- **Cache issues**: Clear .next folder and rebuild

---

This document serves as my primary reference for development workflow and should be consulted when starting any new task or troubleshooting issues.