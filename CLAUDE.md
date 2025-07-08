# CreatorCompass - Claude Code Documentation

## Project Overview

CreatorCompass is a comprehensive creator growth platform built with Next.js 15, designed to help content creators on YouTube, TikTok, and Twitch grow their audience through structured 90-day roadmaps, gamification, and platform-specific guidance.

**Key Technologies:**
- Next.js 15 with App Router and TypeScript
- Prisma ORM with SQLite (dev) and PostgreSQL (production)
- NextAuth.js for authentication (Google/GitHub OAuth)
- Zustand for state management with database persistence
- Tailwind CSS with custom design system
- Vitest + React Testing Library for unit tests
- Playwright for end-to-end testing
- Docker containerization with docker-compose
- PWA capabilities with service workers

## Quick Start Commands

### Development
```bash
# Start development server (uses Turbopack)
npm run dev

# Database setup and seeding
npm run db:push
npm run db:seed

# Testing
npm run test              # Unit tests with Vitest
npm run test:watch        # Unit tests in watch mode
npm run test:e2e          # E2E tests with Playwright
npm run test:e2e:ui       # E2E tests with UI

# Build and analyze
npm run build
npm run analyze           # Bundle analysis
```

### Production
```bash
# Docker deployment
docker-compose up -d

# Local production build
npm run build
npm start
```

## Architecture Overview

### Directory Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth-related pages
│   ├── dashboard/         # Dashboard pages
│   ├── onboarding/        # Onboarding flow
│   └── api/               # API routes
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── dashboard/         # Dashboard components
│   ├── engagement/        # Gamification system
│   ├── onboarding/        # Onboarding components
│   ├── platform-features/ # Platform-specific features
│   ├── providers/         # Context providers
│   └── ui/                # Shadcn/UI components
├── data/                  # Static JSON data
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── store/                 # Zustand state management
├── test/                  # Test utilities
└── types/                 # TypeScript definitions
```

### Key Components

**Authentication System:**
- NextAuth.js with Google/GitHub OAuth providers
- Mock authentication for development testing
- Protected routes via middleware
- Session management with providers

**Database Layer:**
- Prisma ORM with comprehensive schema
- User profiles, progress tracking, achievements
- Database utilities in `src/lib/db.ts`
- SQLite for development, PostgreSQL for production

**State Management:**
- Zustand stores with database persistence
- App state and user-specific state separation
- Local storage sync for offline capabilities

**UI System:**
- Shadcn/UI components with Tailwind CSS
- Responsive design with mobile-first approach
- Custom design system with CSS variables
- Framer Motion for animations

## Development Environment Setup

### Environment Variables
Create `.env.local` with:
```bash
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# OAuth (for production)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Development
NEXT_PUBLIC_MOCK_AUTH="true"  # Enable mock auth for testing
```

### Database Setup
```bash
# Initialize database
npx prisma db push

# Seed with test data
npm run db:seed

# View database
npx prisma studio
```

### Testing Setup
- Mock authentication system for development
- Test user: `test@creatorcompass.app`
- Pre-seeded with sample data for all features
- Comprehensive test suites for components and workflows

## Core Features

### 1. Platform Support
- **YouTube**: Channel optimization, content planning, analytics
- **TikTok**: Short-form content strategies, trending topics
- **Twitch**: Streaming setup, community building, monetization

### 2. 90-Day Roadmap System
- Structured phases with weekly tasks
- Progress tracking with points and achievements
- Personalized recommendations based on niche and goals

### 3. Gamification
- Achievement system with badges and rewards
- Progress streaks and leaderboards
- Celebration system with animations
- Point-based progression

### 4. User Onboarding
- Platform selection flow
- Niche identification
- Goal setting and customization
- Personalized roadmap generation

### 5. Dashboard Features
- Progress overview with analytics
- Today's tasks and quick actions
- Achievement banners and notifications
- Responsive design for mobile/desktop

## Database Schema

### Core Models
- **User**: NextAuth.js user management
- **UserProfile**: Platform, niche, goals, preferences
- **UserProgress**: Task completion tracking
- **UserStats**: Points, streaks, levels
- **UserAchievement**: Achievement unlocks
- **Celebration**: Notification system

### Key Relationships
- User → UserProfile (1:1)
- User → UserProgress (1:many)
- User → UserStats (1:1)
- User → UserAchievement (1:many)

## Common Development Tasks

### Adding New Features
1. Create components in appropriate feature folder
2. Add database models if needed (update schema.prisma)
3. Create API routes for data operations
4. Update store for state management
5. Add comprehensive tests
6. Update types and documentation

### Testing Guidelines
- Unit tests for all components and hooks
- E2E tests for user workflows
- Mock authentication for development
- Database seeding for consistent test data

### Performance Optimization
- Next.js bundle analysis with `npm run analyze`
- Image optimization with next/image
- Code splitting and dynamic imports
- Service worker for offline capabilities

## Production Deployment

### Docker Setup
```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Environment Configuration
- PostgreSQL for production database
- OAuth providers configured
- Security headers enabled
- Performance monitoring setup

## PWA Features

### Offline Capabilities
- Service worker for caching
- Offline page for no connectivity
- Local storage sync
- Background sync for data

### Installation
- PWA manifest configured
- Install prompts for mobile/desktop
- App-like experience with navigation
- Push notifications (future enhancement)

## Troubleshooting

### Common Issues
1. **Port 3000 in use**: Next.js will auto-switch to 3001
2. **Database connection**: Ensure Prisma is pushed and seeded
3. **Authentication errors**: Check environment variables
4. **Build failures**: Run `npm run lint` and fix issues

### Development Tips
- Use mock authentication for faster development
- Seed database frequently for consistent testing
- Check browser console for client-side errors
- Use React DevTools for component debugging

### Testing Issues
- Ensure test database is seeded
- Clear localStorage between tests
- Check for async timing issues
- Mock external API calls

## File Locations

### Key Configuration Files
- `next.config.ts` - Next.js configuration
- `prisma/schema.prisma` - Database schema
- `src/lib/auth.ts` - Authentication setup
- `src/middleware.ts` - Route protection
- `docker-compose.yml` - Production deployment
- `package.json` - Dependencies and scripts

### Important Data Files
- `src/data/platforms.json` - Platform configurations
- `src/data/roadmaps.json` - 90-day roadmap data
- `src/data/achievements.json` - Achievement definitions
- `src/data/templates.json` - Content templates

### Testing Files
- `vitest.config.ts` - Unit test configuration
- `playwright.config.ts` - E2E test configuration
- `src/test/setup.ts` - Test environment setup
- `prisma/seed.ts` - Database seeding script

## Best Practices

### Code Style
- Use TypeScript for all new code
- Follow ESLint rules (`npm run lint`)
- Use Prettier for formatting
- Component-first architecture

### State Management
- Use Zustand for complex state
- Persist important data to database
- Use React state for local component state
- Implement proper error handling

### Performance
- Optimize images with next/image
- Use dynamic imports for code splitting
- Implement proper caching strategies
- Monitor bundle size with analyzer

### Security
- Validate all user inputs
- Use environment variables for secrets
- Implement proper authentication
- Follow security best practices

This documentation provides everything needed for future Claude instances to understand and work effectively with the CreatorCompass codebase.