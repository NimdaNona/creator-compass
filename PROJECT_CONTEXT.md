# Project Context & Important Details

## User Context & Preferences

### Communication Style
- Wants extreme thoroughness and meticulousness
- Expects comprehensive research before implementation
- Values strategic planning and documentation
- Appreciates detailed progress updates
- Prefers phased approach to development

### Working Relationship
- User serves as "human bridge" for external platform access
- User handles: API credentials, platform configurations, strategic decisions
- Claude Code handles: All development, research, implementation, testing
- Collaborative approach with clear communication

### Key Directives
- "EXTREMELY thorough" - Research extensively before implementing
- Read every line of relevant code before making changes
- Use all available MCP servers (filesystem, brave-search, sequential-thinking)
- Document comprehensively for future reference
- Test thoroughly at each stage

## Project Background

### Origin Story
- Initially built as "CreatorCompass" by Claude Code
- Research docs were originally in .docx format (difficult to read)
- Converted to markdown for better accessibility
- Extracted content JSON files were created as workaround (can be deleted)
- Domain changed to include "AI" - creatorsaicompass.com

### Vision Evolution
- Started as creator growth platform
- Evolved to "Creators AI Compass" - intelligent guide for content creators
- AI branding without actual AI (for now) - create the "feel" of intelligence
- Future plans for actual AI integration
- Focus on being the "compass" metaphor throughout

### Business Model
- Freemium SaaS model
- Free tier: Single platform, 30-day roadmap, limited features
- Premium tier: $9.99/month or $99/year
- All advanced features behind paywall
- Email verification required for paid features

## Technical Quirks & Notes

### Authentication Specifics
- Google OAuth redirect URI: https://creatorsaicompass.com/api/auth/callback/google
- Email provider uses Resend SMTP (not traditional providers)
- Password reset tokens expire after 1 hour
- Email verification required before accessing paid features
- JWT strategy (not database sessions) due to Credentials provider

### Database Considerations
- Using Neon (Vercel Postgres) - connection pooling important
- Prisma as ORM - sometimes requires special handling
- Database in US East region
- Connection string includes pooler for better performance

### Deployment Specifics
- Vercel automatically deploys on git push
- Environment variables must be added via Vercel dashboard
- Preview deployments use 'development' environment
- Production uses 'production' environment
- Build cache helps with deployment speed

### Known Issues & Workarounds
- TypeScript strict mode can be challenging - use 'any' sparingly
- Some ESLint rules are overly strict (can disable if needed)
- Prisma generate runs automatically on install
- Service worker needs careful cache management
- React Server Components have hydration considerations

## Content Strategy

### Research Documents Available
1. YouTube Playbook Master Doc (90-day comprehensive guide)
2. TikTok Playbook (platform-specific strategies)
3. Twitch Growth Guide (streaming focus)
4. Cross-Platform Strategies (multi-platform approach)
5. Creator Growth Benchmark
6. AI Assistance and Future Trends

### Content Implementation Approach
- Use research docs as source of truth
- Create dynamic feel without actual AI
- Platform-specific recommendations based on research
- Niche-specific customization from documented strategies
- Progressive disclosure of information (don't overwhelm)

### Key Features from Research
- **Daily Tasks**: Specific, actionable, platform-optimized
- **Content Ideas**: Niche-specific, trend-aware
- **Templates**: Scripts, thumbnails, descriptions
- **Best Practices**: Platform-specific optimization
- **Growth Strategies**: Data-backed approaches
- **Community Features**: Collaboration and accountability

## User Preferences & Patterns

### Development Preferences
- Comprehensive documentation for context retention
- Phase-based implementation approach
- Extensive testing before moving to next phase
- Clear separation of dev/prod environments
- Emphasis on code quality over speed

### Feature Priorities
1. Core functionality first (auth, payments)
2. Value-adding features second (enhanced roadmaps)
3. Nice-to-have features last (advanced analytics)
4. Always consider paywall placement
5. Mobile PWA experience is crucial

### Quality Standards
- "Enterprise-grade feel" for PWA
- Smooth, responsive UI on all devices
- Clear value proposition at every step
- Professional email communications
- Celebration of user achievements

## External Integrations

### Current Integrations
- **Google OAuth**: Configured and working
- **Resend**: Email delivery (API key provided)
- **Stripe**: Payment processing (live keys provided)
- **Neon**: Database (via Vercel integration)
- **Upstash**: Redis for rate limiting (via Vercel)

### Planned Integrations
- Platform APIs (YouTube, TikTok) - only if simple
- Analytics services - avoiding complex setups
- AI services - future consideration
- Export functionality - for user data

### Integration Philosophy
- Prefer simple integrations over complex ones
- Avoid requiring users to set up developer accounts
- If API key is needed, process must be very simple
- Always provide fallback for external service failures

## Important URLs & Resources

### Production
- Main site: https://creatorsaicompass.com
- API endpoints: https://creatorsaicompass.com/api/*

### Development
- Local: http://localhost:3000
- Preview: https://creator-compass-*.vercel.app

### External Dashboards
- Vercel: Project dashboard for deployments
- Stripe: Payment and subscription management
- Neon: Database management
- Google Cloud: OAuth configuration

## Success Metrics & Goals

### Technical Goals
- Fast page loads (under 3s)
- High Lighthouse scores (90+)
- Zero runtime errors
- Smooth user experience
- Reliable payment processing

### Business Goals
- High free-to-paid conversion
- Low churn rate
- High user engagement
- Positive user feedback
- Sustainable growth

### Development Goals
- Clean, maintainable code
- Comprehensive documentation
- Thorough testing
- Smooth deployment process
- Easy future enhancements

## Communication Templates

### Commit Messages
```
<type>: <description>

<detailed changes>

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Progress Updates
- What was completed
- What's in progress
- What's next
- Any blockers or questions

### Issue Reporting
- Clear problem description
- Steps to reproduce
- Expected vs actual behavior
- Relevant code/errors
- Proposed solution

---

This document captures the nuanced context and "soft knowledge" about the project that might otherwise be lost between sessions.