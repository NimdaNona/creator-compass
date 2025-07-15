import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TemplateData {
  name: string;
  category: string;
  description: string;
  content: any; // Template content with variables
  variables: any; // Variable definitions
  platform: string;
  niche?: string;
  tags: string[];
  requiresPremium: boolean;
  previewContent?: string;
}

// Comprehensive templates based on research
const templates: TemplateData[] = [
  // YouTube Templates
  {
    name: "YouTube Video Hook Template",
    category: "video-scripts",
    description: "Create compelling hooks that grab viewers in the first 15 seconds",
    content: {
      template: `{{hook_type}}

{{opening_statement}}

In this video, {{value_proposition}}.

{{credibility_statement}}

Let's dive in!`,
      sections: {
        hook_types: [
          "You won't believe what happened when...",
          "The #1 mistake people make with {{topic}}...",
          "Here's exactly how I {{achievement}}...",
          "Everyone thinks {{common_belief}}, but actually...",
          "{{shocking_stat}}% of people don't know this..."
        ],
        tips: [
          "Start with action or emotion",
          "Promise specific value",
          "Create curiosity gap",
          "Use pattern interrupts"
        ]
      }
    },
    variables: {
      hook_type: { type: "select", options: ["question", "statement", "statistic", "story"], required: true },
      opening_statement: { type: "text", placeholder: "Your attention-grabbing opener", required: true },
      value_proposition: { type: "text", placeholder: "What viewers will learn/gain", required: true },
      credibility_statement: { type: "text", placeholder: "Why they should listen to you", required: false },
      topic: { type: "text", placeholder: "Video topic", required: true },
      achievement: { type: "text", placeholder: "Your achievement", required: false },
      common_belief: { type: "text", placeholder: "Common misconception", required: false },
      shocking_stat: { type: "number", placeholder: "Surprising percentage", required: false }
    },
    platform: "youtube",
    tags: ["hooks", "engagement", "retention"],
    requiresPremium: false,
    previewContent: "Master the art of YouTube hooks with this proven template"
  },
  {
    name: "YouTube Video Structure Template",
    category: "video-scripts",
    description: "Complete video structure optimized for retention and engagement",
    content: {
      template: `# {{video_title}}

## Hook (0-15 seconds)
{{hook_content}}

## Introduction (15-30 seconds)
- Who you are: {{creator_intro}}
- What this video covers: {{video_overview}}
- Why it matters: {{value_statement}}

## Main Content ({{content_duration}} minutes)
{{#each main_points}}
### Point {{@index}}: {{this.title}}
- Key insight: {{this.insight}}
- Example: {{this.example}}
- Takeaway: {{this.takeaway}}
{{/each}}

## Call to Action
- Primary CTA: {{primary_cta}}
- Secondary CTA: {{secondary_cta}}

## End Screen (20 seconds)
- Next video suggestion: {{next_video}}
- Subscribe reminder: {{subscribe_message}}`,
      sections: {
        structure_tips: [
          "Keep intro under 30 seconds",
          "Use chapter markers",
          "Include b-roll suggestions",
          "Add pattern interrupts every 30-60 seconds"
        ]
      }
    },
    variables: {
      video_title: { type: "text", required: true },
      hook_content: { type: "textarea", required: true },
      creator_intro: { type: "text", required: true },
      video_overview: { type: "textarea", required: true },
      value_statement: { type: "text", required: true },
      content_duration: { type: "number", default: 8, required: true },
      main_points: { 
        type: "array", 
        minItems: 3,
        maxItems: 7,
        itemType: {
          title: { type: "text", required: true },
          insight: { type: "text", required: true },
          example: { type: "text", required: true },
          takeaway: { type: "text", required: true }
        }
      },
      primary_cta: { type: "text", required: true },
      secondary_cta: { type: "text", required: false },
      next_video: { type: "text", required: true },
      subscribe_message: { type: "text", default: "Subscribe for more content like this!" }
    },
    platform: "youtube",
    tags: ["structure", "script", "planning"],
    requiresPremium: true,
    previewContent: "Professional video structure used by top creators"
  },
  
  // TikTok Templates
  {
    name: "TikTok Viral Hook Generator",
    category: "short-form",
    description: "Create scroll-stopping hooks for TikTok videos",
    content: {
      template: `{{hook_style}}

{{#if use_text_overlay}}
Text Overlay: {{text_overlay}}
{{/if}}

Opening Line: {{opening_line}}

Visual: {{visual_description}}`,
      hook_styles: {
        "question": "POV: {{scenario_description}}",
        "statement": "{{bold_claim}} (here's proof)",
        "story": "Story time: {{story_teaser}}",
        "list": "{{number}} things {{audience}} needs to know",
        "transformation": "From {{before_state}} to {{after_state}} in {{timeframe}}"
      }
    },
    variables: {
      hook_style: { 
        type: "select", 
        options: ["question", "statement", "story", "list", "transformation"],
        required: true 
      },
      use_text_overlay: { type: "boolean", default: true },
      text_overlay: { type: "text", required: false, maxLength: 40 },
      opening_line: { type: "text", required: true },
      visual_description: { type: "text", placeholder: "What viewers see in first frame", required: true },
      scenario_description: { type: "text", required: false },
      bold_claim: { type: "text", required: false },
      story_teaser: { type: "text", required: false },
      number: { type: "number", min: 3, max: 10, required: false },
      audience: { type: "text", placeholder: "your target audience", required: false },
      before_state: { type: "text", required: false },
      after_state: { type: "text", required: false },
      timeframe: { type: "text", placeholder: "30 days, 1 week, etc.", required: false }
    },
    platform: "tiktok",
    tags: ["hooks", "viral", "short-form"],
    requiresPremium: false,
    previewContent: "Hook templates that have generated millions of views"
  },
  {
    name: "TikTok Content Series Planner",
    category: "content-planning",
    description: "Plan a binge-worthy TikTok content series",
    content: {
      template: `# {{series_name}} Series Plan

## Series Concept
{{series_concept}}

## Target Audience
- Demographics: {{target_demographics}}
- Interests: {{target_interests}}
- Pain Points: {{pain_points}}

## Episode Structure
Total Episodes: {{episode_count}}
Episode Length: {{episode_length}} seconds

{{#each episodes}}
### Episode {{episode_number}}: {{episode_title}}
- Hook: {{episode_hook}}
- Main Content: {{episode_content}}
- Cliffhanger: {{episode_cliffhanger}}
- CTA: {{episode_cta}}
{{/each}}

## Series Hashtags
Primary: #{{primary_hashtag}}
Series-Specific: #{{series_hashtag}}
Additional: {{additional_hashtags}}

## Posting Schedule
- Frequency: {{posting_frequency}}
- Best Times: {{posting_times}}
- Duration: {{series_duration}} days`,
      tips: [
        "Keep consistent visual style",
        "Use same sound/music for branding",
        "Create custom series hashtag",
        "Tease next episode in comments"
      ]
    },
    variables: {
      series_name: { type: "text", required: true },
      series_concept: { type: "textarea", required: true },
      target_demographics: { type: "text", required: true },
      target_interests: { type: "text", required: true },
      pain_points: { type: "textarea", required: true },
      episode_count: { type: "number", min: 3, max: 30, default: 7, required: true },
      episode_length: { type: "number", min: 15, max: 60, default: 30, required: true },
      episodes: {
        type: "array",
        minItems: 3,
        itemType: {
          episode_number: { type: "number", required: true },
          episode_title: { type: "text", required: true },
          episode_hook: { type: "text", required: true },
          episode_content: { type: "textarea", required: true },
          episode_cliffhanger: { type: "text", required: true },
          episode_cta: { type: "text", required: true }
        }
      },
      primary_hashtag: { type: "text", required: true },
      series_hashtag: { type: "text", required: true },
      additional_hashtags: { type: "text", required: true },
      posting_frequency: { type: "select", options: ["daily", "every other day", "twice daily"], required: true },
      posting_times: { type: "text", default: "9 AM & 7 PM EST", required: true },
      series_duration: { type: "number", required: true }
    },
    platform: "tiktok",
    tags: ["series", "planning", "content-strategy"],
    requiresPremium: true,
    previewContent: "Create binge-worthy series that keep viewers coming back"
  },
  
  // Twitch Templates
  {
    name: "Twitch Stream Planning Template",
    category: "streaming",
    description: "Plan engaging Twitch streams that grow your audience",
    content: {
      template: `# Stream Plan: {{stream_title}}

## Stream Info
- Date: {{stream_date}}
- Duration: {{stream_duration}} hours
- Category: {{stream_category}}
- Tags: {{stream_tags}}

## Pre-Stream Checklist
{{#each pre_stream_tasks}}
- [ ] {{this}}
{{/each}}

## Stream Schedule
{{#each stream_segments}}
### {{segment_time}} - {{segment_name}} ({{segment_duration}} mins)
{{segment_description}}
{{#if segment_interaction}}
Viewer Interaction: {{segment_interaction}}
{{/if}}
{{/each}}

## Engagement Strategy
- Welcome Message: {{welcome_message}}
- Commands: {{chat_commands}}
- Polls/Games: {{interactive_elements}}
- Raid Target: {{raid_target}}

## Post-Stream
- Highlight Moments: {{highlight_timestamps}}
- Social Media Posts: {{social_posts}}
- Next Stream Teaser: {{next_stream_teaser}}`,
      sections: {
        tips: [
          "Start with high energy",
          "Acknowledge new followers/subs immediately",
          "Take breaks every 2 hours",
          "End with a raid to support others"
        ]
      }
    },
    variables: {
      stream_title: { type: "text", required: true },
      stream_date: { type: "date", required: true },
      stream_duration: { type: "number", min: 2, max: 12, default: 4, required: true },
      stream_category: { type: "text", required: true },
      stream_tags: { type: "text", required: true },
      pre_stream_tasks: {
        type: "array",
        default: [
          "Test audio/video quality",
          "Update stream title and category",
          "Post on social media",
          "Prepare overlays and alerts",
          "Review talking points"
        ]
      },
      stream_segments: {
        type: "array",
        minItems: 3,
        itemType: {
          segment_time: { type: "text", required: true },
          segment_name: { type: "text", required: true },
          segment_duration: { type: "number", required: true },
          segment_description: { type: "textarea", required: true },
          segment_interaction: { type: "text", required: false }
        }
      },
      welcome_message: { type: "textarea", required: true },
      chat_commands: { type: "textarea", required: true },
      interactive_elements: { type: "textarea", required: true },
      raid_target: { type: "text", required: false },
      highlight_timestamps: { type: "textarea", required: false },
      social_posts: { type: "textarea", required: true },
      next_stream_teaser: { type: "text", required: true }
    },
    platform: "twitch",
    tags: ["streaming", "planning", "engagement"],
    requiresPremium: false,
    previewContent: "Professional stream planning template used by partnered streamers"
  },
  
  // Cross-Platform Templates
  {
    name: "30-Day Content Calendar",
    category: "content-planning",
    description: "Plan a month of content across all platforms",
    content: {
      template: `# {{month_year}} Content Calendar

## Monthly Theme: {{monthly_theme}}
## Goals: {{monthly_goals}}

## Week 1: {{week1_theme}}
{{#each week1_content}}
### Day {{day_number}} - {{platform}}
- Content Type: {{content_type}}
- Topic: {{topic}}
- Hook/Title: {{hook}}
- CTA: {{cta}}
- Cross-Promotion: {{cross_promo}}
{{/each}}

## Week 2: {{week2_theme}}
{{#each week2_content}}
### Day {{day_number}} - {{platform}}
- Content Type: {{content_type}}
- Topic: {{topic}}
- Hook/Title: {{hook}}
- CTA: {{cta}}
- Cross-Promotion: {{cross_promo}}
{{/each}}

## Week 3: {{week3_theme}}
{{#each week3_content}}
### Day {{day_number}} - {{platform}}
- Content Type: {{content_type}}
- Topic: {{topic}}
- Hook/Title: {{hook}}
- CTA: {{cta}}
- Cross-Promotion: {{cross_promo}}
{{/each}}

## Week 4: {{week4_theme}}
{{#each week4_content}}
### Day {{day_number}} - {{platform}}
- Content Type: {{content_type}}
- Topic: {{topic}}
- Hook/Title: {{hook}}
- CTA: {{cta}}
- Cross-Promotion: {{cross_promo}}
{{/each}}

## Batch Creation Schedule
{{#each batch_days}}
- {{batch_day}}: {{batch_tasks}}
{{/each}}

## Analytics Review
- Weekly Review Day: {{review_day}}
- Key Metrics: {{key_metrics}}
- Adjustment Strategy: {{adjustment_strategy}}`,
      tips: [
        "Batch similar content types",
        "Plan cross-platform promotion",
        "Leave room for trending topics",
        "Schedule analytics reviews"
      ]
    },
    variables: {
      month_year: { type: "text", required: true },
      monthly_theme: { type: "text", required: true },
      monthly_goals: { type: "textarea", required: true },
      week1_theme: { type: "text", required: true },
      week1_content: { type: "array", minItems: 5, maxItems: 7, itemType: {
        day_number: { type: "number", required: true },
        platform: { type: "select", options: ["YouTube", "TikTok", "Twitch", "Instagram", "Twitter"], required: true },
        content_type: { type: "text", required: true },
        topic: { type: "text", required: true },
        hook: { type: "text", required: true },
        cta: { type: "text", required: true },
        cross_promo: { type: "text", required: false }
      }},
      week2_theme: { type: "text", required: true },
      week2_content: { type: "array", minItems: 5, maxItems: 7, itemType: {
        day_number: { type: "number", required: true },
        platform: { type: "select", options: ["YouTube", "TikTok", "Twitch", "Instagram", "Twitter"], required: true },
        content_type: { type: "text", required: true },
        topic: { type: "text", required: true },
        hook: { type: "text", required: true },
        cta: { type: "text", required: true },
        cross_promo: { type: "text", required: false }
      }},
      week3_theme: { type: "text", required: true },
      week3_content: { type: "array", minItems: 5, maxItems: 7, itemType: {
        day_number: { type: "number", required: true },
        platform: { type: "select", options: ["YouTube", "TikTok", "Twitch", "Instagram", "Twitter"], required: true },
        content_type: { type: "text", required: true },
        topic: { type: "text", required: true },
        hook: { type: "text", required: true },
        cta: { type: "text", required: true },
        cross_promo: { type: "text", required: false }
      }},
      week4_theme: { type: "text", required: true },
      week4_content: { type: "array", minItems: 5, maxItems: 7, itemType: {
        day_number: { type: "number", required: true },
        platform: { type: "select", options: ["YouTube", "TikTok", "Twitch", "Instagram", "Twitter"], required: true },
        content_type: { type: "text", required: true },
        topic: { type: "text", required: true },
        hook: { type: "text", required: true },
        cta: { type: "text", required: true },
        cross_promo: { type: "text", required: false }
      }},
      batch_days: { type: "array", minItems: 2, itemType: {
        batch_day: { type: "text", required: true },
        batch_tasks: { type: "text", required: true }
      }},
      review_day: { type: "select", options: ["Monday", "Friday", "Sunday"], default: "Sunday", required: true },
      key_metrics: { type: "textarea", required: true },
      adjustment_strategy: { type: "textarea", required: true }
    },
    platform: "all",
    tags: ["planning", "calendar", "cross-platform"],
    requiresPremium: true,
    previewContent: "Complete content calendar system for multi-platform creators"
  },
  
  // Analytics Templates
  {
    name: "Weekly Analytics Report",
    category: "analytics-reporting",
    description: "Track and analyze your weekly performance across platforms",
    content: {
      template: `# Weekly Analytics Report: {{week_ending}}

## Overview
**Total Reach**: {{total_reach}}
**Engagement Rate**: {{engagement_rate}}%
**Growth Rate**: {{growth_rate}}%

## Platform Breakdown

### YouTube
- Views: {{youtube_views}} ({{youtube_views_change}}% from last week)
- Watch Time: {{youtube_watch_hours}} hours
- New Subscribers: {{youtube_new_subs}}
- Top Video: {{youtube_top_video}}
- CTR: {{youtube_ctr}}%
- AVD: {{youtube_avd}}%

### TikTok
- Views: {{tiktok_views}}
- Followers Gained: {{tiktok_followers_gained}}
- Engagement Rate: {{tiktok_engagement}}%
- Top Video: {{tiktok_top_video}}
- Completion Rate: {{tiktok_completion}}%

### Twitch
- Stream Hours: {{twitch_hours}}
- Average Viewers: {{twitch_avg_viewers}}
- New Followers: {{twitch_new_followers}}
- Peak Viewers: {{twitch_peak_viewers}}
- Subscription Revenue: \${{twitch_sub_revenue}}

## Content Performance
{{#each top_content}}
### {{content_title}}
- Platform: {{platform}}
- Metrics: {{metrics}}
- Success Factors: {{success_factors}}
{{/each}}

## Key Insights
{{#each insights}}
- {{this}}
{{/each}}

## Action Items for Next Week
{{#each action_items}}
1. {{this}}
{{/each}}

## Goals vs. Actual
{{#each goals}}
- {{goal_name}}: {{goal_target}} vs {{goal_actual}} ({{goal_percentage}}%)
{{/each}}`
    },
    variables: {
      week_ending: { type: "date", required: true },
      total_reach: { type: "number", required: true },
      engagement_rate: { type: "number", required: true },
      growth_rate: { type: "number", required: true },
      youtube_views: { type: "number", required: true },
      youtube_views_change: { type: "number", required: true },
      youtube_watch_hours: { type: "number", required: true },
      youtube_new_subs: { type: "number", required: true },
      youtube_top_video: { type: "text", required: true },
      youtube_ctr: { type: "number", required: true },
      youtube_avd: { type: "number", required: true },
      tiktok_views: { type: "number", required: true },
      tiktok_followers_gained: { type: "number", required: true },
      tiktok_engagement: { type: "number", required: true },
      tiktok_top_video: { type: "text", required: true },
      tiktok_completion: { type: "number", required: true },
      twitch_hours: { type: "number", required: false },
      twitch_avg_viewers: { type: "number", required: false },
      twitch_new_followers: { type: "number", required: false },
      twitch_peak_viewers: { type: "number", required: false },
      twitch_sub_revenue: { type: "number", required: false },
      top_content: { type: "array", minItems: 3, itemType: {
        content_title: { type: "text", required: true },
        platform: { type: "text", required: true },
        metrics: { type: "text", required: true },
        success_factors: { type: "text", required: true }
      }},
      insights: { type: "array", minItems: 3, maxItems: 5 },
      action_items: { type: "array", minItems: 3, maxItems: 7 },
      goals: { type: "array", minItems: 2, itemType: {
        goal_name: { type: "text", required: true },
        goal_target: { type: "number", required: true },
        goal_actual: { type: "number", required: true },
        goal_percentage: { type: "number", required: true }
      }}
    },
    platform: "all",
    tags: ["analytics", "reporting", "performance"],
    requiresPremium: true,
    previewContent: "Professional analytics template to track your growth"
  }
];

async function seedTemplates() {
  console.log('🌱 Starting to seed templates...');

  // Create or get system user for templates
  const systemUser = await prisma.user.upsert({
    where: { email: 'system@creatorsaicompass.com' },
    update: {},
    create: {
      email: 'system@creatorsaicompass.com',
      name: 'System',
      emailVerified: new Date(),
    }
  });

  for (const template of templates) {
    try {
      // Generate template ID
      const templateId = template.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      // Ensure we have valid category from schema
      const validCategories = [
        'video-scripts',
        'thumbnails-titles', 
        'content-planning',
        'channel-optimization',
        'audience-growth',
        'analytics-reporting',
        'shorts-reels',
        'streaming',
        'community-building',
        'monetization'
      ];
      
      // Map our categories to valid schema categories
      let category = template.category;
      if (category === 'short-form') category = 'shorts-reels';
      if (!validCategories.includes(category)) {
        category = 'content-planning'; // default fallback
      }

      // Store additional data in the content field along with template
      const enhancedContent = {
        ...template.content,
        description: template.description,
        requiresPremium: template.requiresPremium,
        previewContent: template.previewContent,
        tags: template.tags
      };

      await prisma.generatedTemplate.upsert({
        where: { 
          id: templateId 
        },
        update: {
          category: category,
          type: template.name.includes('Hook') ? 'hook' : 
                template.name.includes('Structure') ? 'structure' : 
                template.name.includes('Calendar') ? 'calendar' :
                template.name.includes('Analytics') ? 'analytics' : 'general',
          title: template.name,
          content: enhancedContent,
          variables: template.variables,
          platform: template.platform || 'all',
          niche: template.niche || 'general',
          isPublic: true,
          uses: 0
        },
        create: {
          id: templateId,
          userId: systemUser.id, // System-generated templates
          category: category,
          type: template.name.includes('Hook') ? 'hook' : 
                template.name.includes('Structure') ? 'structure' : 
                template.name.includes('Calendar') ? 'calendar' :
                template.name.includes('Analytics') ? 'analytics' : 'general',
          title: template.name,
          content: enhancedContent,
          variables: template.variables,
          platform: template.platform || 'all',
          niche: template.niche || 'general',
          isPublic: true,
          uses: 0
        }
      });
      
      console.log(`✅ Created/updated template: ${template.name}`);
    } catch (error) {
      console.error(`❌ Error creating template: ${template.name}`, error);
    }
  }

  console.log('✅ Templates seeding completed!');
}

// Main function
async function main() {
  try {
    await seedTemplates();
    console.log('🎉 All templates seeded successfully!');
  } catch (e) {
    console.error('❌ Seed error:', e);
    throw e;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute if run directly
main().catch((e) => {
  console.error(e);
  process.exit(1);
});

export { seedTemplates };