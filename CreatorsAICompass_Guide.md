# Creators AI Compass - Comprehensive Context Guide

## Critical Context for New Claude Code Sessions

Welcome to the Creators AI Compass project. This guide provides essential context and directs you to all necessary resources to quickly become fully informed about the project's current state, goals, and development approach.

## Project Identity & Vision

**Creators AI Compass** (formerly CreatorCompass) is a comprehensive SaaS platform that serves as an intelligent compass for content creators on YouTube, TikTok, and Twitch. The platform provides personalized 90-day roadmaps, gamification, and platform-specific guidance with a freemium business model.

### Core Mission
Transform aspiring content creators' dreams into reality by providing structured, proven pathways to success. We're not just building an app – we're building the future of creative entrepreneurship.

### Key Differentiator
While branded as "AI Compass," the platform currently creates an intelligent feel through dynamic content generation based on extensive research documentation, with plans for actual AI integration in the future.

## Current Project State

### Completed Phases (✅)
1. **Phase 1**: Authentication & Core Infrastructure
   - Email/password auth with verification
   - Google OAuth integration
   - Resend SMTP email system
   - CI/CD workflow (develop → main)
   - "Creators AI Compass" branding throughout

2. **Phase 2**: Monetization & Paywall Implementation
   - Complete Stripe subscription system
   - Monthly ($9.99) and yearly ($99) pricing
   - Free tier limitations (single platform, 30-day roadmap)
   - Premium features behind paywall
   - Usage tracking and smart upgrade triggers

3. **Phase 3**: Content Enhancement & Dynamic Features
   - Enhanced roadmap system with daily tasks
   - Dynamic content recommendations
   - Platform-specific templates
   - Progress tracking and celebrations
   - Feature preview system for locked content

4. **Phase 4**: Interactive Tools
   - Content calendar with optimal scheduling
   - Content idea generator (niche-specific)
   - Community features and challenges
   - Enhanced PWA functionality
   - Comprehensive mobile experience

5. **Phase 5**: Polish & Optimization (Recently Completed)
   - Notification system with preferences
   - SEO enhancements (sitemap, robots.txt)
   - Performance optimizations
   - Production deployment at creatorsaicompass.com
   - Comprehensive testing completed

### Production Status
- **Live Site**: https://creatorsaicompass.com (fully deployed)
- **Environment**: Vercel with automatic GitHub deployments
- **Database**: Neon PostgreSQL via Vercel
- **All Features**: Implemented and tested in production

## Essential Documentation to Read

### Priority 1 - Must Read First
1. **CLAUDE.md** - Complete technical overview and current state
2. **Initial-Prompt-Questions-Answers-Phases.md** - Original context and user expectations
3. **MASTER_PHASES.md** - All 5 phases with implementation details

### Priority 2 - Development Context
1. **DEV_WORKFLOW.md** - Git workflow, deployment process, technical patterns
2. **PROJECT_CONTEXT.md** - User preferences, quirks, communication style
3. **QUICK_REFERENCE.md** - Common commands and operations

### Priority 3 - Implementation Details
1. **CONTENT_REFERENCE.md** - Platform-specific features and templates
2. **Phase documentation files** (PHASE1_COMPLETED.md through PHASE5_POLISH_OPTIMIZATION.md)
3. **Research documents** in /Docs folder for content source material

## Development Philosophy & Approach

### User's Expectations
The user values **EXTREME thoroughness** above all else. This means:
- Research extensively before implementing anything
- Read every line of relevant code before making changes
- Plan comprehensively before coding
- Test thoroughly at each stage
- Document all important decisions

### Working Relationship
- **You (Claude Code)**: Handle all development, testing, deployment
- **User**: Provides strategic direction, API keys, platform access
- **Collaboration**: Clear communication, phased approach, regular updates

### Quality Standards
- "Enterprise-grade feel" for all features
- Mobile-first, PWA-optimized experience
- Clear value proposition at every step
- Comprehensive error handling
- Functional optimization prioritized

## Technical Environment

### Core Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: NextAuth.js with multiple providers
- **UI**: Tailwind CSS + Shadcn/UI components
- **State**: Zustand with persistence
- **Payments**: Stripe (live integration)
- **Email**: Resend SMTP
- **Hosting**: Vercel

### Environment Setup
- **Production**: main branch → creatorsaicompass.com
- **Development**: develop branch → dev.creatorsaicompass.com
- **Local**: npm run dev (port 3000)

### Key Integrations
- Google OAuth (configured for both environments)
- Stripe (live keys, separate webhooks per environment)
- Resend (email delivery)
- Neon (database via Vercel)
- Upstash Redis (rate limiting via Vercel KV)

## Common Tasks & Workflows

### Daily Development
```bash
git checkout develop
npm run dev
# Make changes, test locally
git add -A && git commit -m "Description" && git push origin develop
```

### Database Updates
```bash
# Edit prisma/schema.prisma
npx prisma db push
npx prisma generate
```

### Production Deployment
```bash
git checkout main
git merge develop
git push origin main
# Vercel auto-deploys
```

## Current Focus Areas

### Immediate Priorities
1. Complete the buildout of the application
2. Address any bugs or issues that arise
3. Resolve all functionality and operational issues
4. Meticulously validate seemless flow and functionality of every feature 

### Future Considerations
- AI integration for content generation
- Platform API integrations (YouTube, TikTok)
- Advanced analytics features
- Mobile app development
- Affiliate program

## Important Context & Quirks

### Authentication
- JWT strategy (not database sessions) due to Credentials provider
- Email verification required for premium features
- Google OAuth configured with specific redirect URIs

### Database
- Using POSTGRES_PRISMA_URL (not DATABASE_URL) for Vercel integration
- Connection pooling important for serverless
- Prisma schema requires both url and directUrl

### Deployment
- Vercel automatically deploys on push
- Environment variables set in Vercel dashboard
- Build cache speeds up deployments
- Middleware handles route protection

### Content Strategy
- Research documents are source of truth
- Create "AI feel" without actual AI (for now)
- Platform-specific customization based on research
- Progressive disclosure to avoid overwhelming users

## Communication Guidelines

### With User
- Provide detailed progress updates
- Ask clarifying questions when needed
- Flag any blockers immediately
- Maintain professional, thorough approach

### Commit Messages
```
feat/fix/chore: Brief description

Detailed explanation of changes

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Documentation
- Update relevant docs when making significant changes
- Document architectural decisions
- Keep README and CLAUDE.md current
- Add inline comments for complex logic

## Success Metrics

### Business
- Free-to-paid conversion > 5%
- Monthly churn < 5%
- User activation > 60%
- NPS > 50

### Development
- Clean, maintainable code
- Comprehensive test coverage
- Smooth deployment process
- Easy onboarding for new developers

## Getting Started Checklist

1. [ ] Read this guide completely
2. [ ] Review CLAUDE.md for technical details
3. [ ] Completlely read Initial-Prompt-Questions-Answers-Phases.md, CreatorCompass Project Overview.md, CONTENT_REFERENCE.md, DEV_WORKFLOW.md, MASTER_PHASES.md, PROJECT_CONTEXT.md, and QUICK_REFERENCEd
1. [ ] Check current branch and environment
2. [ ] Review all necessary codebase files

## Remember

**The user values thoroughness above all else.** When in doubt:
- Research more
- Read more code
- Plan more carefully
- Test more extensively
- Document more clearly

This project represents months of meticulous work across 5 comprehensive phases. Maintain the same level of care and attention to detail in all future work.

---

Last Updated: Phase 5 Completion
Current Status: Production deployment complete, monitoring and optimization phase