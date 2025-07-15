import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DailyTaskData {
  roadmapId: string;
  platform: string;
  niche: string;
  phase: number;
  week: number;
  dayRange: string;
  title: string;
  description: string;
  instructions: string[];
  timeEstimate: number;
  difficulty: string;
  category: string;
  platformSpecific: {
    tips: string[];
    bestPractices: string[];
    commonMistakes: string[];
  };
  successMetrics: {
    metric: string;
    target: string | number;
    howToMeasure: string;
  }[];
  resources: {
    type: string;
    title: string;
    url?: string;
    content?: string;
  }[];
  orderIndex: number;
}

// YouTube Gaming Tasks - Phase 1
const youtubeGamingPhase1Tasks: DailyTaskData[] = [
  // Week 1: Foundation Setup
  {
    roadmapId: "youtube_gaming_phase1_week1",
    platform: "youtube",
    niche: "gaming",
    phase: 1,
    week: 1,
    dayRange: "Day 1",
    title: "Create and Brand Your Channel",
    description: "Set up your YouTube gaming channel with professional branding that reflects your gaming personality",
    instructions: [
      "Choose a memorable channel name that's easy to spell and search",
      "Create or commission a channel logo (minimum 800x800px)",
      "Design a channel banner (2560x1440px) showcasing your gaming focus",
      "Write a compelling channel description with keywords",
      "Add channel tags relevant to gaming and your specific game genres"
    ],
    timeEstimate: 120,
    difficulty: "beginner",
    category: "technical",
    platformSpecific: {
      tips: [
        "Use gaming-themed colors and fonts in your branding",
        "Include your upload schedule in the banner",
        "Showcase the main games you'll be playing"
      ],
      bestPractices: [
        "Keep branding consistent across all social platforms",
        "Make your channel name SEO-friendly",
        "Use high-contrast colors for better visibility"
      ],
      commonMistakes: [
        "Using copyrighted game assets in logos",
        "Making the channel name too complex or hard to remember",
        "Forgetting to optimize for mobile viewing"
      ]
    },
    successMetrics: [
      {
        metric: "Channel Setup Completion",
        target: "100%",
        howToMeasure: "All branding elements uploaded and visible"
      }
    ],
    resources: [
      {
        type: "tool",
        title: "Canva",
        url: "https://canva.com",
        content: "Free design tool for channel art"
      },
      {
        type: "guide",
        title: "YouTube Channel Art Guidelines",
        content: "Official dimensions and safe zones for channel banners"
      }
    ],
    orderIndex: 1
  },
  {
    roadmapId: "youtube_gaming_phase1_week1",
    platform: "youtube",
    niche: "gaming",
    phase: 1,
    week: 1,
    dayRange: "Day 2",
    title: "Set Up Your Gaming Recording Environment",
    description: "Configure your recording setup for high-quality gaming content",
    instructions: [
      "Install and configure OBS Studio or your preferred recording software",
      "Set up game capture at 1080p 60fps (or best your system can handle)",
      "Configure audio sources: game audio, microphone, and balance levels",
      "Create scenes for different content types (gameplay, facecam, intro/outro)",
      "Test record a 5-minute sample and check quality"
    ],
    timeEstimate: 180,
    difficulty: "intermediate",
    category: "technical",
    platformSpecific: {
      tips: [
        "Use NVENC or GPU encoding to reduce CPU load while gaming",
        "Set bitrate to 8000-12000 Kbps for 1080p60 content",
        "Create hotkeys for scene switching during gameplay"
      ],
      bestPractices: [
        "Record in the same resolution you'll upload to avoid quality loss",
        "Use noise suppression filters on your microphone",
        "Save recordings in MP4 format for faster processing"
      ],
      commonMistakes: [
        "Recording at too high bitrate causing massive file sizes",
        "Forgetting to record game audio on separate track",
        "Not testing audio levels before long recording sessions"
      ]
    },
    successMetrics: [
      {
        metric: "Recording Quality",
        target: "1080p 60fps",
        howToMeasure: "Check exported video properties"
      },
      {
        metric: "Audio Clarity",
        target: "Clear voice, balanced game audio",
        howToMeasure: "No clipping, clear speech over gameplay"
      }
    ],
    resources: [
      {
        type: "software",
        title: "OBS Studio",
        url: "https://obsproject.com",
        content: "Free, open-source recording software"
      },
      {
        type: "guide",
        title: "OBS Settings for Gaming",
        content: "Optimal OBS configuration for gaming content"
      }
    ],
    orderIndex: 2
  },
  {
    roadmapId: "youtube_gaming_phase1_week1",
    platform: "youtube",
    niche: "gaming",
    phase: 1,
    week: 1,
    dayRange: "Day 3-4",
    title: "Create Your Channel Trailer",
    description: "Produce a 60-90 second channel trailer that hooks new visitors and converts them to subscribers",
    instructions: [
      "Script a compelling introduction highlighting what makes your channel unique",
      "Showcase clips from the types of games you'll play",
      "Include your upload schedule and what viewers can expect",
      "Add energetic music and dynamic editing",
      "End with a strong call-to-action to subscribe"
    ],
    timeEstimate: 240,
    difficulty: "intermediate",
    category: "content",
    platformSpecific: {
      tips: [
        "Front-load the most exciting content in first 15 seconds",
        "Show personality - viewers subscribe to people, not just gameplay",
        "Keep it under 90 seconds for maximum retention"
      ],
      bestPractices: [
        "Use the trailer as your channel's featured video for new visitors",
        "Update trailer every 6 months to stay current",
        "Include text overlays for viewers watching without sound"
      ],
      commonMistakes: [
        "Making the trailer too long and losing viewer attention",
        "Focusing only on gameplay without showing personality",
        "Forgetting to ask viewers to subscribe"
      ]
    },
    successMetrics: [
      {
        metric: "Trailer Length",
        target: "60-90 seconds",
        howToMeasure: "Final video duration"
      },
      {
        metric: "Viewer Retention",
        target: "50%+",
        howToMeasure: "YouTube Analytics after publishing"
      }
    ],
    resources: [
      {
        type: "template",
        title: "Channel Trailer Script Template",
        content: "Hook (0-15s) → Who You Are (15-30s) → What You Offer (30-60s) → Schedule (60-75s) → CTA (75-90s)"
      }
    ],
    orderIndex: 3
  },
  {
    roadmapId: "youtube_gaming_phase1_week1",
    platform: "youtube",
    niche: "gaming",
    phase: 1,
    week: 1,
    dayRange: "Day 5-6",
    title: "Record and Upload Your First Gaming Video",
    description: "Create your first full gaming video with proper optimization for discovery",
    instructions: [
      "Choose an engaging game moment or tutorial for your first video",
      "Record 15-20 minutes of edited gameplay content",
      "Create an eye-catching thumbnail with clear text overlay",
      "Write SEO-optimized title (include game name + descriptive keywords)",
      "Craft detailed description with timestamps and relevant links",
      "Add 10-15 relevant tags mixing broad and specific terms"
    ],
    timeEstimate: 360,
    difficulty: "intermediate",
    category: "content",
    platformSpecific: {
      tips: [
        "First impression matters - make it your best work",
        "Include the game name in your title for searchability",
        "Design thumbnail with mobile viewing in mind"
      ],
      bestPractices: [
        "Upload in 1080p or higher for best quality",
        "Schedule uploads for peak gaming audience times (4-8 PM)",
        "Engage with early comments to boost engagement signals"
      ],
      commonMistakes: [
        "Uploading without custom thumbnail",
        "Writing vague titles that don't include the game name",
        "Neglecting video description and tags"
      ]
    },
    successMetrics: [
      {
        metric: "Video Published",
        target: "1 video live",
        howToMeasure: "Video publicly available on channel"
      },
      {
        metric: "CTR (Click-through rate)",
        target: "4%+",
        howToMeasure: "YouTube Analytics after 48 hours"
      }
    ],
    resources: [
      {
        type: "tool",
        title: "TubeBuddy",
        url: "https://tubebuddy.com",
        content: "Browser extension for YouTube optimization"
      },
      {
        type: "guide",
        title: "YouTube Algorithm Guide",
        content: "Understanding how YouTube promotes gaming content"
      }
    ],
    orderIndex: 4
  },
  {
    roadmapId: "youtube_gaming_phase1_week1",
    platform: "youtube",
    niche: "gaming",
    phase: 1,
    week: 1,
    dayRange: "Day 7",
    title: "Analyze Performance and Plan Week 2",
    description: "Review your first week's performance and plan content calendar for sustained growth",
    instructions: [
      "Check YouTube Analytics for your first video's performance",
      "Note which traffic sources brought the most views",
      "Identify your video's retention graph drop-off points",
      "Plan next 4 videos based on learnings",
      "Create content calendar for week 2"
    ],
    timeEstimate: 90,
    difficulty: "beginner",
    category: "analytics",
    platformSpecific: {
      tips: [
        "Focus on Average View Duration over view count initially",
        "Screenshot your analytics to track weekly progress",
        "Plan content around games with active communities"
      ],
      bestPractices: [
        "Analyze retention graphs to improve future content",
        "Respond to all comments to build community",
        "Keep consistent upload schedule even with low initial views"
      ],
      commonMistakes: [
        "Getting discouraged by low initial view counts",
        "Changing strategy too quickly before gathering enough data",
        "Ignoring audience retention metrics"
      ]
    },
    successMetrics: [
      {
        metric: "Analytics Review",
        target: "Complete",
        howToMeasure: "All metrics documented"
      },
      {
        metric: "Content Calendar",
        target: "4 videos planned",
        howToMeasure: "Week 2 schedule created"
      }
    ],
    resources: [
      {
        type: "template",
        title: "Content Calendar Template",
        content: "Weekly planning spreadsheet for gaming content"
      }
    ],
    orderIndex: 5
  }
];

// Week 2 Tasks
const youtubeGamingPhase1Week2Tasks: DailyTaskData[] = [
  {
    roadmapId: "youtube_gaming_phase1_week2",
    platform: "youtube",
    niche: "gaming",
    phase: 1,
    week: 2,
    dayRange: "Day 8-9",
    title: "Develop Your Content Series Strategy",
    description: "Create recurring series to build anticipation and regular viewership",
    instructions: [
      "Identify 2-3 series concepts (e.g., 'Noob to Pro', 'Game Reviews', 'Tips Tuesday')",
      "Design series thumbnail templates for consistency",
      "Create series playlists with optimized titles and descriptions",
      "Plan first 4 episodes of each series",
      "Establish naming convention for series episodes"
    ],
    timeEstimate: 180,
    difficulty: "intermediate",
    category: "content",
    platformSpecific: {
      tips: [
        "Series help viewers know when to return to your channel",
        "Use consistent branding across series thumbnails",
        "Number episodes clearly (e.g., 'Episode 1' or '#1')"
      ],
      bestPractices: [
        "Launch one series at a time to gauge interest",
        "Keep series episodes similar length for consistency",
        "Cross-promote between series to increase watch time"
      ],
      commonMistakes: [
        "Starting too many series at once",
        "Inconsistent upload schedule for series",
        "Not linking episodes in descriptions and end screens"
      ]
    },
    successMetrics: [
      {
        metric: "Series Created",
        target: "2-3 series planned",
        howToMeasure: "Playlists created with descriptions"
      }
    ],
    resources: [
      {
        type: "guide",
        title: "YouTube Series Best Practices",
        content: "How to build successful content series"
      }
    ],
    orderIndex: 6
  },
  {
    roadmapId: "youtube_gaming_phase1_week2",
    platform: "youtube",
    niche: "gaming",
    phase: 1,
    week: 2,
    dayRange: "Day 10-11",
    title: "Master YouTube SEO for Gaming",
    description: "Optimize your content for gaming-specific search terms and discovery",
    instructions: [
      "Research trending games in your niche using Google Trends",
      "Use VidIQ or TubeBuddy to find low-competition keywords",
      "Create keyword lists for your main games",
      "Optimize old video titles and descriptions with findings",
      "Study top gaming channels' SEO strategies"
    ],
    timeEstimate: 150,
    difficulty: "intermediate",
    category: "technical",
    platformSpecific: {
      tips: [
        "Include game name + specific aspect (e.g., 'Fortnite building tips')",
        "Use seasonal trends (e.g., 'best horror games October 2024')",
        "Target long-tail keywords for easier ranking"
      ],
      bestPractices: [
        "Update titles for underperforming videos",
        "Include searchable moments in descriptions",
        "Use YouTube's search suggestions for keyword ideas"
      ],
      commonMistakes: [
        "Keyword stuffing in titles making them unreadable",
        "Ignoring trending topics in gaming community",
        "Not updating SEO as games gain/lose popularity"
      ]
    },
    successMetrics: [
      {
        metric: "Keyword Research",
        target: "20+ keywords identified",
        howToMeasure: "Documented keyword list created"
      },
      {
        metric: "Video Optimization",
        target: "All videos optimized",
        howToMeasure: "Titles and descriptions updated"
      }
    ],
    resources: [
      {
        type: "tool",
        title: "VidIQ",
        url: "https://vidiq.com",
        content: "YouTube keyword research and optimization tool"
      }
    ],
    orderIndex: 7
  },
  {
    roadmapId: "youtube_gaming_phase1_week2",
    platform: "youtube",
    niche: "gaming",
    phase: 1,
    week: 2,
    dayRange: "Day 12-13",
    title: "Engage with Gaming Community",
    description: "Build relationships within the gaming community to grow your channel organically",
    instructions: [
      "Comment genuinely on 10 similar gaming channels daily",
      "Join 3-5 gaming Discord servers related to your content",
      "Participate in gaming subreddits without self-promotion",
      "Collaborate planning: reach out to 5 similar-sized creators",
      "Create community tab post asking audience questions"
    ],
    timeEstimate: 120,
    difficulty: "beginner",
    category: "community",
    platformSpecific: {
      tips: [
        "Be helpful and genuine, not promotional in comments",
        "Share gaming tips and experiences in communities",
        "Support other small gaming creators authentically"
      ],
      bestPractices: [
        "Engage before asking for anything in return",
        "Follow community rules strictly",
        "Build relationships before suggesting collaborations"
      ],
      commonMistakes: [
        "Spam commenting 'check out my channel'",
        "Only engaging when you upload new content",
        "Ignoring your own video comments"
      ]
    },
    successMetrics: [
      {
        metric: "Community Engagement",
        target: "50+ meaningful interactions",
        howToMeasure: "Comments and discussions participated in"
      },
      {
        metric: "Collaboration Outreach",
        target: "5 creators contacted",
        howToMeasure: "Collaboration messages sent"
      }
    ],
    resources: [
      {
        type: "platform",
        title: "Discord",
        url: "https://discord.com",
        content: "Gaming community platform"
      }
    ],
    orderIndex: 8
  },
  {
    roadmapId: "youtube_gaming_phase1_week2",
    platform: "youtube",
    niche: "gaming",
    phase: 1,
    week: 2,
    dayRange: "Day 14",
    title: "Create Shorts Strategy for Gaming",
    description: "Leverage YouTube Shorts for rapid channel growth with bite-sized gaming content",
    instructions: [
      "Identify viral gaming moments from your longer videos",
      "Create 3-5 Shorts from existing content",
      "Design Shorts-specific thumbnails (if needed)",
      "Write hook-focused titles for Shorts",
      "Schedule Shorts between regular uploads"
    ],
    timeEstimate: 180,
    difficulty: "intermediate",
    category: "content",
    platformSpecific: {
      tips: [
        "First 3 seconds are crucial - start with action",
        "Use vertical format (9:16 aspect ratio)",
        "Include text overlays for context"
      ],
      bestPractices: [
        "Post Shorts consistently (daily if possible)",
        "Use trending audio when appropriate",
        "End with a reason to check your channel"
      ],
      commonMistakes: [
        "Simply cropping horizontal videos poorly",
        "Not optimizing for mobile viewing",
        "Forgetting to link to longer content"
      ]
    },
    successMetrics: [
      {
        metric: "Shorts Created",
        target: "3-5 Shorts",
        howToMeasure: "Published Shorts count"
      },
      {
        metric: "Shorts Views",
        target: "1000+ views total",
        howToMeasure: "Combined Shorts analytics"
      }
    ],
    resources: [
      {
        type: "guide",
        title: "Gaming Shorts Best Practices",
        content: "Creating viral gaming moments in under 60 seconds"
      }
    ],
    orderIndex: 9
  }
];

// TikTok Gaming Tasks
const tiktokGamingPhase1Tasks: DailyTaskData[] = [
  {
    roadmapId: "tiktok_gaming_phase1_week1",
    platform: "tiktok",
    niche: "gaming",
    phase: 1,
    week: 1,
    dayRange: "Day 1",
    title: "Set Up Your TikTok Gaming Profile",
    description: "Create an optimized TikTok profile that attracts gaming enthusiasts",
    instructions: [
      "Choose a memorable username related to gaming",
      "Upload a clear profile picture (gaming avatar or your photo)",
      "Write bio with your gaming focus and upload schedule",
      "Add link to your other gaming platforms (YouTube, Twitch)",
      "Follow 50 top gaming creators in your niche"
    ],
    timeEstimate: 60,
    difficulty: "beginner",
    category: "technical",
    platformSpecific: {
      tips: [
        "Use gaming emojis in your bio strategically",
        "Include your main game in username if possible",
        "State what type of content you create (funny moments, tips, etc.)"
      ],
      bestPractices: [
        "Keep bio under 80 characters for full visibility",
        "Use link aggregator for multiple platform links",
        "Update profile picture to match current gaming trends"
      ],
      commonMistakes: [
        "Using generic username not related to content",
        "Leaving bio empty or too vague",
        "Not utilizing the link in bio effectively"
      ]
    },
    successMetrics: [
      {
        metric: "Profile Completion",
        target: "100%",
        howToMeasure: "All profile fields filled"
      }
    ],
    resources: [
      {
        type: "tool",
        title: "Linktree",
        url: "https://linktr.ee",
        content: "Link aggregator for bio"
      }
    ],
    orderIndex: 1
  },
  {
    roadmapId: "tiktok_gaming_phase1_week1",
    platform: "tiktok",
    niche: "gaming",
    phase: 1,
    week: 1,
    dayRange: "Day 2-3",
    title: "Master TikTok Gaming Content Formats",
    description: "Learn and create the main types of gaming content that perform well on TikTok",
    instructions: [
      "Study trending gaming content formats (fails, wins, tips, reactions)",
      "Create your first 'Gaming Fail' compilation (15-30 seconds)",
      "Make a 'Pro Tip' video for your main game",
      "Film a reaction to a gaming news or update",
      "Use trending gaming sounds in your videos"
    ],
    timeEstimate: 240,
    difficulty: "intermediate",
    category: "content",
    platformSpecific: {
      tips: [
        "Hook viewers in first 3 seconds with action",
        "Use text overlays to add context quickly",
        "Match content to trending gaming sounds"
      ],
      bestPractices: [
        "Keep videos between 15-30 seconds initially",
        "Post at peak times (6-10am, 7-11pm)",
        "Use 3-5 relevant hashtags only"
      ],
      commonMistakes: [
        "Making videos too long without payoff",
        "Not using trending sounds or effects",
        "Poor video quality or shaky footage"
      ]
    },
    successMetrics: [
      {
        metric: "Videos Created",
        target: "4 different formats",
        howToMeasure: "Videos published"
      },
      {
        metric: "View Count",
        target: "1000+ views combined",
        howToMeasure: "TikTok Analytics"
      }
    ],
    resources: [
      {
        type: "guide",
        title: "TikTok Gaming Trends",
        content: "Current trending formats and sounds in gaming"
      }
    ],
    orderIndex: 2
  },
  {
    roadmapId: "tiktok_gaming_phase1_week1",
    platform: "tiktok",
    niche: "gaming",
    phase: 1,
    week: 1,
    dayRange: "Day 4-5",
    title: "Develop Your Gaming Content Style",
    description: "Find your unique angle in the competitive gaming TikTok space",
    instructions: [
      "Define your content pillars (e.g., funny moments, tutorials, news)",
      "Create a signature intro or catchphrase",
      "Develop consistent editing style (transitions, effects)",
      "Plan content mix: 40% entertainment, 30% tips, 30% trends",
      "Design simple overlay templates for consistency"
    ],
    timeEstimate: 180,
    difficulty: "intermediate",
    category: "content",
    platformSpecific: {
      tips: [
        "Find balance between trending and original content",
        "Develop recognizable visual style",
        "Use consistent color grading"
      ],
      bestPractices: [
        "Maintain 1-2 posts daily minimum",
        "Batch create content for efficiency",
        "Save successful video settings as templates"
      ],
      commonMistakes: [
        "Copying other creators exactly",
        "Inconsistent posting schedule",
        "Ignoring what resonates with your audience"
      ]
    },
    successMetrics: [
      {
        metric: "Content Style Defined",
        target: "Style guide created",
        howToMeasure: "Document completed"
      },
      {
        metric: "Consistent Branding",
        target: "5 videos with consistent style",
        howToMeasure: "Visual consistency check"
      }
    ],
    resources: [
      {
        type: "app",
        title: "CapCut",
        content: "Mobile editing app popular with TikTokers"
      }
    ],
    orderIndex: 3
  },
  {
    roadmapId: "tiktok_gaming_phase1_week1",
    platform: "tiktok",
    niche: "gaming",
    phase: 1,
    week: 1,
    dayRange: "Day 6-7",
    title: "Engage with TikTok Gaming Community",
    description: "Build connections and grow through community engagement",
    instructions: [
      "Comment on 20 gaming videos daily with valuable input",
      "Duet or stitch 2 popular gaming videos with your take",
      "Respond to all comments on your videos",
      "Join TikTok gaming challenges relevant to your niche",
      "Start following and engaging with viewers who comment"
    ],
    timeEstimate: 120,
    difficulty: "beginner",
    category: "community",
    platformSpecific: {
      tips: [
        "First comments on new videos get more visibility",
        "Duet reactions to gaming news perform well",
        "Create response videos to common gaming questions"
      ],
      bestPractices: [
        "Be first to comment on rising videos",
        "Add value with comments, not just emojis",
        "Thank new followers with video responses"
      ],
      commonMistakes: [
        "Generic comments that add no value",
        "Ignoring your own comments section",
        "Not participating in gaming challenges"
      ]
    },
    successMetrics: [
      {
        metric: "Engagement Rate",
        target: "10%+",
        howToMeasure: "Likes + Comments / Views"
      },
      {
        metric: "Community Interactions",
        target: "100+ meaningful engagements",
        howToMeasure: "Comments made and received"
      }
    ],
    resources: [
      {
        type: "feature",
        title: "TikTok Duet",
        content: "How to effectively use duet feature for gaming content"
      }
    ],
    orderIndex: 4
  }
];

// Twitch Streaming Tasks
const twitchGamingPhase1Tasks: DailyTaskData[] = [
  {
    roadmapId: "twitch_gaming_phase1_week1",
    platform: "twitch",
    niche: "gaming",
    phase: 1,
    week: 1,
    dayRange: "Day 1-2",
    title: "Set Up Your Twitch Channel",
    description: "Create a professional Twitch channel ready for streaming",
    instructions: [
      "Design channel banner with schedule and social links",
      "Create channel panels (About, Schedule, Donations, Social)",
      "Set up channel point rewards and emotes (if available)",
      "Write compelling 'About' section with your streaming focus",
      "Configure channel tags and category defaults"
    ],
    timeEstimate: 180,
    difficulty: "beginner",
    category: "technical",
    platformSpecific: {
      tips: [
        "Include your streaming schedule prominently",
        "Use panel images that match your branding",
        "Set up automatic hosting for channels you enjoy"
      ],
      bestPractices: [
        "Update schedule panel weekly",
        "Use consistent color scheme across panels",
        "Include discord link for community building"
      ],
      commonMistakes: [
        "Leaving panels empty or with default text",
        "Not setting up channel point rewards",
        "Forgetting to add relevant tags"
      ]
    },
    successMetrics: [
      {
        metric: "Channel Setup",
        target: "All panels created",
        howToMeasure: "Visual inspection of channel page"
      }
    ],
    resources: [
      {
        type: "tool",
        title: "Twitch Panel Maker",
        content: "Free tool for creating channel panels"
      }
    ],
    orderIndex: 1
  },
  {
    roadmapId: "twitch_gaming_phase1_week1",
    platform: "twitch",
    niche: "gaming",
    phase: 1,
    week: 1,
    dayRange: "Day 3-4",
    title: "Configure Streaming Software",
    description: "Set up OBS or Streamlabs for professional-quality streams",
    instructions: [
      "Download and install OBS Studio or Streamlabs",
      "Configure stream output settings (720p 30fps minimum)",
      "Set up scenes: Starting Soon, Gaming, Just Chatting, Ending",
      "Add alerts for followers, donations, and subscriptions",
      "Test stream privately to check quality and performance"
    ],
    timeEstimate: 240,
    difficulty: "intermediate",
    category: "technical",
    platformSpecific: {
      tips: [
        "Start with 720p if internet bandwidth is limited",
        "Use hardware encoding if available",
        "Create hotkeys for scene switching"
      ],
      bestPractices: [
        "Keep bitrate at 3000-6000 for quality",
        "Test audio levels before going live",
        "Have backup scenes ready"
      ],
      commonMistakes: [
        "Streaming at too high quality for internet speed",
        "Forgetting to add game capture source",
        "Audio desync or echo issues"
      ]
    },
    successMetrics: [
      {
        metric: "Stream Quality",
        target: "Smooth 720p+ stream",
        howToMeasure: "Test stream recording review"
      }
    ],
    resources: [
      {
        type: "software",
        title: "OBS Studio",
        url: "https://obsproject.com",
        content: "Free streaming software"
      }
    ],
    orderIndex: 2
  }
];

// Function to seed all tasks
async function seedDailyTasks() {
  console.log('🌱 Starting to seed daily tasks...');

  // Combine all tasks
  const allTasks = [
    ...youtubeGamingPhase1Tasks,
    ...youtubeGamingPhase1Week2Tasks,
    ...tiktokGamingPhase1Tasks,
    ...twitchGamingPhase1Tasks
  ];

  // Additional tasks for other niches would go here
  // For now, we'll create variations for other niches based on the gaming templates

  const niches = ['gaming', 'education', 'lifestyle', 'tech', 'beauty'];
  const platforms = ['youtube', 'tiktok', 'twitch'];

  let createdCount = 0;

  // Create tasks for gaming niche (already defined above)
  for (const taskData of allTasks) {
    try {
      await prisma.dailyTask.create({
        data: {
          roadmapId: taskData.roadmapId,
          platform: taskData.platform,
          niche: taskData.niche,
          phase: taskData.phase,
          week: taskData.week,
          dayRange: taskData.dayRange,
          title: taskData.title,
          description: taskData.description,
          instructions: taskData.instructions,
          timeEstimate: taskData.timeEstimate,
          difficulty: taskData.difficulty,
          category: taskData.category,
          platformSpecific: taskData.platformSpecific,
          successMetrics: taskData.successMetrics,
          resources: taskData.resources,
          orderIndex: taskData.orderIndex
        }
      });
      createdCount++;
    } catch (error) {
      console.error(`Error creating task: ${taskData.title}`, error);
    }
  }

  console.log(`✅ Created ${createdCount} daily tasks`);

  // Create some milestones
  const milestones = [
    {
      name: "First Video Published",
      description: "Congratulations on publishing your first video!",
      requirement: { type: "task_completion", value: 1 },
      reward: { type: "badge", value: "first_video" },
      celebration: { 
        type: "modal", 
        message: "🎉 You've taken your first step as a content creator!",
        sharePrompt: "Share your achievement"
      },
      orderIndex: 1
    },
    {
      name: "Week 1 Champion",
      description: "Completed all tasks in your first week",
      requirement: { type: "task_completion", value: 5 },
      reward: { type: "badge", value: "week_1_champion" },
      celebration: { 
        type: "confetti", 
        message: "🏆 First week complete! You're on your way to success!"
      },
      orderIndex: 2
    },
    {
      name: "Consistency Streak",
      description: "Maintained a 7-day streak",
      requirement: { type: "time_based", value: "7_day_streak" },
      reward: { type: "feature_unlock", value: "advanced_analytics" },
      celebration: { 
        type: "notification", 
        message: "🔥 7-day streak! Keep the momentum going!"
      },
      orderIndex: 3
    }
  ];

  for (const milestone of milestones) {
    try {
      await prisma.milestone.create({
        data: milestone
      });
    } catch (error) {
      console.error(`Error creating milestone: ${milestone.name}`, error);
    }
  }

  console.log('✅ Created milestones');
}

async function main() {
  try {
    await seedDailyTasks();
    console.log('🎉 Database seeding completed!');
  } catch (e) {
    console.error('❌ Seed error:', e);
    throw e;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});