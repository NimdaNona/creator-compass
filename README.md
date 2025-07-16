# Creators AI Compass 🧭

An intelligent, AI-powered platform designed to guide content creators on their journey to success. Built with cutting-edge technology to provide personalized roadmaps, dynamic content generation, and real-time assistance.

![Creators AI Compass](https://creatorsaicompass.com/og-image.png)

## 🚀 Live Demo

- **Production**: [https://creatorsaicompass.com](https://creatorsaicompass.com)
- **Development**: [https://dev.creatorsaicompass.com](https://dev.creatorsaicompass.com)

> **Note**: AI features require a valid OpenAI API key. See [AI Setup](#openai-setup) for configuration instructions.

## ✨ Key Features

### AI-Powered Intelligence
- **🤖 Conversational Onboarding**: Natural language onboarding that learns about creators through conversation
- **🎯 Dynamic Roadmaps**: AI-generated 90-day personalized roadmaps based on creator profile
- **💬 AI Assistant**: Always-available floating chat assistant for real-time help
- **📝 Smart Templates**: 12 types of AI-powered content generation templates
- **🧠 Intelligent Insights**: Personalized recommendations and progress-based guidance

### Creator Tools
- **📅 Content Calendar**: Drag-and-drop calendar with AI-powered scheduling optimization
- **💡 Idea Generator**: AI-powered content ideas based on trends and niche
- **📊 Analytics Dashboard**: Comprehensive metrics and growth tracking
- **🏆 Achievement System**: Gamified progress tracking with celebrations
- **🔧 Platform Tools**: Specialized tools for YouTube, TikTok, and Twitch

### Modern Architecture
- **⚡ Next.js 15**: Latest App Router with React Server Components
- **🎨 Beautiful UI**: Tailwind CSS with custom animations and Shadcn/UI
- **🔐 Secure Auth**: NextAuth.js with Google OAuth and email authentication
- **💳 Monetization**: Stripe integration with subscription tiers
- **📱 PWA Ready**: Installable progressive web app with offline support

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon) with Prisma ORM
- **AI**: OpenAI GPT-4 API
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **Styling**: Tailwind CSS + Shadcn/UI
- **State**: Zustand
- **Animations**: Framer Motion
- **Hosting**: Vercel
- **Email**: Resend

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- OpenAI API key
- Stripe account
- Google OAuth credentials

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-repo/creator-compass.git
cd creator-compass
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your `.env.local` with required keys:
```env
# Database
DATABASE_URL="your-postgres-url"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"

# OpenAI
OPENAI_API_KEY="sk-..."

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Stripe
STRIPE_SECRET_KEY="sk_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."

# Email
RESEND_API_KEY="..."
```

5. Push database schema:
```bash
npx prisma db push
npx prisma generate
```

6. Seed the database:
```bash
npm run db:seed
```

7. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/            # React components
│   ├── ai/               # AI-powered components
│   ├── dashboard/        # Dashboard components
│   ├── ui/               # Base UI components
│   └── ...
├── lib/                   # Utilities and services
│   ├── ai/               # AI service layer
│   ├── auth.ts           # Authentication config
│   └── ...
├── store/                 # Zustand state management
└── types/                 # TypeScript definitions
```

## 🤖 AI Features Configuration

### OpenAI Setup
1. Get your API key from [OpenAI Platform](https://platform.openai.com)
2. Add to environment variables
3. For production, use Vercel CLI:
```bash
vercel env add OPENAI_API_KEY production
```

### AI Components
- **Conversational Onboarding**: `/src/components/onboarding/AIOnboarding.tsx`
- **AI Assistant Widget**: `/src/components/ai/AIAssistantWidget.tsx`
- **Template Generator**: `/src/components/templates/AITemplateGenerator.tsx`
- **Dashboard Insights**: `/src/components/dashboard/AIInsights.tsx`

### Knowledge Base
Place research documents in `/src/lib/ai/knowledge-base/` for context-aware responses.

## 🚀 Deployment

### Vercel Deployment
1. Push to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Environment Variables
Add all variables from `.env.example` to Vercel dashboard:
- Go to Settings → Environment Variables
- Add each variable for Production/Preview environments
- Don't forget `OPENAI_API_KEY`!

## 📊 Features by Subscription Tier

### Free Tier
- Basic roadmap access
- 10 AI templates/month
- 50 AI chat messages/month
- Single platform tracking

### Pro Tier ($9.99/month)
- Unlimited AI features
- All platforms
- Advanced analytics
- Priority support

### Studio Tier ($29.99/month)
- Everything in Pro
- Team collaboration
- Custom branding
- API access

## 🧪 Testing

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Build test
npm run build
```

## 📝 Documentation

- [AI Implementation](./AI_IMPLEMENTATION.md)
- [Development Workflow](./DEV_WORKFLOW.md)
- [Phase Documentation](./MASTER_PHASES.md)
- [API Documentation](./docs/api/README.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ for content creators
- Powered by OpenAI GPT-4
- UI components from [shadcn/ui](https://ui.shadcn.com)

---

**Need help?** Check our [documentation](./docs) or reach out on [Discord](https://discord.gg/creators-compass)