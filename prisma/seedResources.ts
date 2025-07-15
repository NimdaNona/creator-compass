import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Resource categories
type ResourceCategory = 'guides' | 'tools' | 'templates' | 'tutorials' | 'community' | 'analytics' | 'monetization';
type ResourceType = 'article' | 'video' | 'tool' | 'template' | 'course' | 'community' | 'service';

interface ResourceData {
  title: string;
  description: string;
  category: ResourceCategory;
  type: ResourceType;
  url?: string;
  content?: string;
  platform?: string;
  isPremium: boolean;
  tags: string[];
  author?: string;
  difficulty?: string;
}

// Comprehensive resource library based on research
const resources: ResourceData[] = [
  // YouTube Resources
  {
    title: "YouTube Algorithm Deep Dive",
    description: "Understanding how YouTube's recommendation system works and how to optimize for it",
    category: "guides",
    type: "article",
    content: `
# YouTube Algorithm Mastery Guide

## Key Ranking Factors:
1. **Click-Through Rate (CTR)**: Aim for 6-10%+
2. **Average View Duration**: Target 50%+ retention
3. **Session Duration**: Keep viewers on platform
4. **Engagement Signals**: Likes, comments, shares

## Optimization Strategies:
- Focus on first 15 seconds hook
- Use pattern interrupts every 15-30 seconds
- Create binge-worthy series
- Optimize end screens for 20% CTR

## Title Optimization:
- Front-load keywords in first 60 characters
- Use emotional triggers
- Include numbers when relevant
- A/B test variations

## Thumbnail Best Practices:
- High contrast colors
- Clear focal point
- Readable text (if used)
- Consistent branding
- Test multiple versions
    `,
    platform: "youtube",
    isPremium: false,
    tags: ["algorithm", "optimization", "growth"],
    difficulty: "intermediate"
  },
  {
    title: "YouTube Analytics Mastery",
    description: "Complete guide to understanding and leveraging YouTube Studio analytics",
    category: "analytics",
    type: "course",
    content: `
# YouTube Analytics Complete Guide

## Key Metrics to Track:
1. **Impressions & CTR**: Traffic sources
2. **Retention Graphs**: Identify drop-off points
3. **Revenue Analytics**: RPM vs CPM
4. **Audience Analytics**: Demographics & interests

## Advanced Analytics:
- Funnel visualization
- Comparative analysis
- Seasonal trends
- Device & traffic source breakdown
    `,
    platform: "youtube",
    isPremium: true,
    tags: ["analytics", "metrics", "data"],
    difficulty: "advanced"
  },
  
  // TikTok Resources
  {
    title: "TikTok Growth Hacking Playbook",
    description: "Proven strategies to grow from 0 to 10k followers on TikTok",
    category: "guides",
    type: "article",
    content: `
# TikTok Growth Hacking Strategies

## The TikTok Algorithm:
- Completion rate is KING (aim for 80%+)
- Engagement rate matters (likes, comments, shares)
- Watch time and rewatches boost visibility
- Speed of engagement impacts viral potential

## Content Strategy:
1. **Hook in 0.5 seconds**: No intro, straight to value
2. **15-30 second sweet spot**: Maximum completion
3. **Loop-able content**: Encourage rewatches
4. **Trend-jacking**: Use trending sounds early

## Posting Strategy:
- 1-4 times daily for maximum growth
- Peak times: 6-10am, 7-11pm
- Consistency matters more than perfection
- Engage immediately after posting

## Hashtag Strategy:
- Mix of niche (2-3) and broad (2-3) hashtags
- Include trending hashtags when relevant
- Create branded hashtag for community
    `,
    platform: "tiktok",
    isPremium: false,
    tags: ["growth", "algorithm", "strategy"],
    difficulty: "beginner"
  },
  {
    title: "TikTok Content Calendar Template",
    description: "30-day content planning template optimized for TikTok",
    category: "templates",
    type: "template",
    content: `
# 30-Day TikTok Content Calendar

## Week 1: Foundation
- Day 1-2: Trend participation
- Day 3-4: Educational content
- Day 5-6: Behind the scenes
- Day 7: Community engagement

## Week 2: Experimentation
- Test different formats
- Try new trends
- Collaborate with others
- Analyze what works

## Week 3: Double Down
- Repeat successful formats
- Create series content
- Build on viral videos
- Engage with community

## Week 4: Scale & Optimize
- Increase posting frequency
- Refine content strategy
- Plan next month
- Review analytics
    `,
    platform: "tiktok",
    isPremium: true,
    tags: ["planning", "calendar", "content"],
    difficulty: "intermediate"
  },
  
  // Twitch Resources
  {
    title: "Twitch Affiliate Fast Track",
    description: "Reach Twitch Affiliate status in 30 days or less",
    category: "guides",
    type: "course",
    content: `
# Twitch Affiliate Requirements & Strategy

## Requirements:
- 50 followers
- 500 total minutes broadcast
- 7 unique broadcast days
- Average of 3 viewers

## Fast Track Strategy:
1. **Consistency**: Stream 4-5 days/week, same time
2. **Game Selection**: Choose games with 500-5000 viewers
3. **Networking**: Raid and host other streamers
4. **Community**: Engage actively in chat
5. **Social Media**: Promote streams on Twitter/TikTok

## Revenue Optimization:
- Bits and cheers strategy
- Subscription perks
- Donation setup
- Sponsorship preparation
    `,
    platform: "twitch",
    isPremium: false,
    tags: ["monetization", "affiliate", "growth"],
    difficulty: "beginner"
  },
  
  // Cross-Platform Resources
  {
    title: "Content Repurposing Masterclass",
    description: "Turn one piece of content into 10+ posts across platforms",
    category: "guides",
    type: "video",
    url: "https://example.com/repurposing-masterclass",
    content: `
# Content Repurposing Framework

## The 1-to-10 Method:
1. **Long-form video** (YouTube)
2. **Short clips** (TikTok/Shorts/Reels)
3. **Audio podcast** (Spotify)
4. **Blog post** (Website/Medium)
5. **Twitter thread** (Key points)
6. **Instagram carousel** (Visual summary)
7. **LinkedIn article** (Professional angle)
8. **Email newsletter** (Exclusive insights)
9. **Community post** (Behind scenes)
10. **Live stream** (Q&A follow-up)
    `,
    platform: null,
    isPremium: true,
    tags: ["efficiency", "cross-platform", "strategy"],
    difficulty: "intermediate"
  },
  
  // Tools & Services
  {
    title: "TubeBuddy Pro Guide",
    description: "Master YouTube SEO with TubeBuddy's advanced features",
    category: "tools",
    type: "tool",
    url: "https://www.tubebuddy.com",
    isPremium: true,
    tags: ["seo", "optimization", "youtube"],
    difficulty: "intermediate"
  },
  {
    title: "Canva Content Creation Pack",
    description: "1000+ templates for thumbnails, banners, and social posts",
    category: "tools",
    type: "template",
    url: "https://www.canva.com",
    isPremium: false,
    tags: ["design", "thumbnails", "graphics"],
    difficulty: "beginner"
  },
  {
    title: "StreamLabs OBS Setup Guide",
    description: "Professional streaming setup for beginners",
    category: "tutorials",
    type: "video",
    platform: "twitch",
    isPremium: false,
    tags: ["streaming", "setup", "obs"],
    difficulty: "beginner"
  },
  
  // Monetization Resources
  {
    title: "Creator Monetization Blueprint",
    description: "7 revenue streams every creator should know",
    category: "monetization",
    type: "course",
    content: `
# 7 Revenue Streams for Creators

1. **Ad Revenue**: YouTube Partner Program, TikTok Creator Fund
2. **Sponsorships**: Brand deals and partnerships
3. **Affiliate Marketing**: Product recommendations
4. **Digital Products**: Courses, presets, templates
5. **Physical Products**: Merch, prints
6. **Services**: Coaching, consulting
7. **Fan Funding**: Patreon, memberships, super chats

## Revenue Timeline:
- Month 1-3: Focus on growth
- Month 4-6: Ad revenue + affiliates
- Month 7-12: Sponsorships + products
- Year 2+: Diversified income streams
    `,
    isPremium: true,
    tags: ["revenue", "monetization", "business"],
    difficulty: "advanced"
  },
  
  // Community Resources
  {
    title: "Discord Server Setup Template",
    description: "Create an engaging community Discord server",
    category: "community",
    type: "template",
    content: `
# Discord Server Structure

## Essential Channels:
- #welcome-rules
- #announcements
- #general-chat
- #content-updates
- #feedback
- #off-topic

## Engagement Channels:
- #memes
- #fan-art
- #clips-highlights
- #collabs

## Voice Channels:
- General Voice
- Gaming Sessions
- Study/Work Together
- AFK Channel

## Roles & Permissions:
- New Member
- Active Member
- VIP/Supporter
- Moderator
- Admin

## Bots to Install:
- MEE6 (leveling)
- Dyno (moderation)
- Carl-bot (reaction roles)
- Streamcord (stream alerts)
    `,
    platform: null,
    isPremium: true,
    tags: ["community", "discord", "engagement"],
    difficulty: "intermediate"
  }
];

async function seedResources() {
  console.log('🌱 Starting to seed resources...');

  // First, create resource categories if they don't exist
  const categories = ['guides', 'tools', 'templates', 'tutorials', 'community', 'analytics', 'monetization'];
  
  for (const resource of resources) {
    try {
      // Generate a unique ID based on title
      const id = resource.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      // Create resource entry
      await prisma.resource.upsert({
        where: { id },
        update: {
          title: resource.title,
          description: resource.description,
          category: resource.category,
          type: resource.type,
          url: resource.url,
          content: resource.content || null,
          platform: resource.platform,
          isPremium: resource.isPremium,
          tags: resource.tags,
          metadata: {
            author: resource.author,
            difficulty: resource.difficulty,
            lastUpdated: new Date().toISOString()
          }
        },
        create: {
          id,
          title: resource.title,
          description: resource.description,
          category: resource.category,
          type: resource.type,
          url: resource.url,
          content: resource.content || null,
          platform: resource.platform,
          isPremium: resource.isPremium,
          tags: resource.tags,
          metadata: {
            author: resource.author,
            difficulty: resource.difficulty,
            createdAt: new Date().toISOString()
          }
        }
      });
      
      console.log(`✅ Created/updated resource: ${resource.title}`);
    } catch (error) {
      console.error(`❌ Error creating resource: ${resource.title}`, error);
    }
  }

  console.log('✅ Resources seeding completed!');
}

// Main function
async function main() {
  try {
    await seedResources();
    console.log('🎉 All resources seeded successfully!');
  } catch (e) {
    console.error('❌ Seed error:', e);
    throw e;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

export { seedResources };