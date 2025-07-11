export interface TrendingTopic {
  id: string;
  title: string;
  category: string;
  platform: string;
  trendScore: number;
  growth: number;
  viewsEstimate: string;
  competition: 'low' | 'medium' | 'high';
  hashtags: string[];
  description: string;
  timeToTrend: string;
  examples: {
    creator: string;
    views: string;
    engagement: string;
  }[];
}

export const trendingTopicsByPlatform: Record<string, TrendingTopic[]> = {
  youtube: [
    {
      id: 'yt-trend-1',
      title: 'Day in the Life Content',
      category: 'Lifestyle',
      platform: 'youtube',
      trendScore: 92,
      growth: 45,
      viewsEstimate: '50K-500K',
      competition: 'medium',
      hashtags: ['dayinthelife', 'vlog', 'routine', 'lifestyle'],
      description: 'Authentic glimpses into daily routines resonate strongly with audiences seeking connection and inspiration.',
      timeToTrend: '2-3 weeks',
      examples: [
        { creator: '@EmmaChamberlain', views: '2.5M', engagement: '12%' },
        { creator: '@MattDAvella', views: '890K', engagement: '8.5%' }
      ]
    },
    {
      id: 'yt-trend-2',
      title: 'AI Tools Exploration',
      category: 'Technology',
      platform: 'youtube',
      trendScore: 95,
      growth: 78,
      viewsEstimate: '100K-1M',
      competition: 'high',
      hashtags: ['AI', 'ChatGPT', 'technology', 'future'],
      description: 'Showcasing practical AI applications and tools is driving massive interest as AI becomes mainstream.',
      timeToTrend: '1-2 weeks',
      examples: [
        { creator: '@MrBeast', views: '5.2M', engagement: '15%' },
        { creator: '@Fireship', views: '1.8M', engagement: '11%' }
      ]
    },
    {
      id: 'yt-trend-3',
      title: 'Sustainable Living Tips',
      category: 'Educational',
      platform: 'youtube',
      trendScore: 88,
      growth: 32,
      viewsEstimate: '30K-200K',
      competition: 'low',
      hashtags: ['sustainability', 'ecofriendly', 'zerowaste', 'climateaction'],
      description: 'Growing environmental consciousness drives interest in practical sustainability content.',
      timeToTrend: '3-4 weeks',
      examples: [
        { creator: '@Shelbizleee', views: '450K', engagement: '9%' },
        { creator: '@SustainablyVegan', views: '280K', engagement: '7.5%' }
      ]
    },
    {
      id: 'yt-trend-4',
      title: 'Budget Travel Guides',
      category: 'Travel',
      platform: 'youtube',
      trendScore: 90,
      growth: 55,
      viewsEstimate: '75K-400K',
      competition: 'medium',
      hashtags: ['budgettravel', 'travel2024', 'backpacking', 'traveltips'],
      description: 'Post-pandemic travel surge with focus on affordable adventures and hidden gems.',
      timeToTrend: '2-3 weeks',
      examples: [
        { creator: '@LostLeBlanc', views: '1.2M', engagement: '10%' },
        { creator: '@IndrigoTraveller', views: '680K', engagement: '8%' }
      ]
    }
  ],
  tiktok: [
    {
      id: 'tt-trend-1',
      title: 'POV Storytelling',
      category: 'Entertainment',
      platform: 'tiktok',
      trendScore: 94,
      growth: 62,
      viewsEstimate: '100K-5M',
      competition: 'medium',
      hashtags: ['POV', 'storytime', 'acting', 'viral'],
      description: 'Creative POV scenarios that viewers can relate to or find entertaining.',
      timeToTrend: '1 week',
      examples: [
        { creator: '@jezellecatherine', views: '8.5M', engagement: '18%' },
        { creator: '@ianboggs', views: '5.2M', engagement: '15%' }
      ]
    },
    {
      id: 'tt-trend-2',
      title: 'Quick Recipe Hacks',
      category: 'Food',
      platform: 'tiktok',
      trendScore: 91,
      growth: 48,
      viewsEstimate: '200K-3M',
      competition: 'high',
      hashtags: ['foodhack', 'quickrecipe', 'cooking', 'foodtok'],
      description: 'Simple, visually appealing recipes that can be made in under 5 minutes.',
      timeToTrend: '3-5 days',
      examples: [
        { creator: '@cookingwithlynja', views: '4.2M', engagement: '20%' },
        { creator: '@thegoldenbalance', views: '2.8M', engagement: '16%' }
      ]
    },
    {
      id: 'tt-trend-3',
      title: 'Outfit Transitions',
      category: 'Fashion',
      platform: 'tiktok',
      trendScore: 89,
      growth: 35,
      viewsEstimate: '150K-2M',
      competition: 'medium',
      hashtags: ['outfitchange', 'fashion', 'style', 'OOTD'],
      description: 'Quick outfit changes synced to music beats for dramatic effect.',
      timeToTrend: '1-2 weeks',
      examples: [
        { creator: '@wisdomkaye', views: '3.5M', engagement: '14%' },
        { creator: '@brittany.xavier', views: '1.9M', engagement: '12%' }
      ]
    },
    {
      id: 'tt-trend-4',
      title: 'Life Hack Testing',
      category: 'Educational',
      platform: 'tiktok',
      trendScore: 87,
      growth: 41,
      viewsEstimate: '100K-1.5M',
      competition: 'low',
      hashtags: ['lifehack', 'testing', 'doesitwork', 'experiment'],
      description: 'Testing viral life hacks to see if they actually work.',
      timeToTrend: '1 week',
      examples: [
        { creator: '@sidneyraz', views: '2.1M', engagement: '17%' },
        { creator: '@problemsolved', views: '1.3M', engagement: '13%' }
      ]
    }
  ],
  twitch: [
    {
      id: 'tw-trend-1',
      title: 'Just Chatting IRL',
      category: 'Lifestyle',
      platform: 'twitch',
      trendScore: 93,
      growth: 58,
      viewsEstimate: '5K-50K concurrent',
      competition: 'medium',
      hashtags: ['justchatting', 'IRL', 'stream', 'community'],
      description: 'Real conversations and activities beyond gaming, building genuine connections.',
      timeToTrend: 'Ongoing',
      examples: [
        { creator: '@HasanAbi', views: '45K avg', engagement: '25%' },
        { creator: '@Amouranth', views: '15K avg', engagement: '20%' }
      ]
    },
    {
      id: 'tw-trend-2',
      title: 'Speedrun Attempts',
      category: 'Gaming',
      platform: 'twitch',
      trendScore: 88,
      growth: 22,
      viewsEstimate: '2K-20K concurrent',
      competition: 'high',
      hashtags: ['speedrun', 'worldrecord', 'gaming', 'competitive'],
      description: 'Attempting to break records in popular games draws dedicated viewers.',
      timeToTrend: 'Event-based',
      examples: [
        { creator: '@Simply', views: '12K avg', engagement: '18%' },
        { creator: '@Distortion2', views: '8K avg', engagement: '15%' }
      ]
    },
    {
      id: 'tw-trend-3',
      title: 'Cooking Streams',
      category: 'Lifestyle',
      platform: 'twitch',
      trendScore: 85,
      growth: 38,
      viewsEstimate: '1K-10K concurrent',
      competition: 'low',
      hashtags: ['cooking', 'food', 'recipe', 'kitchen'],
      description: 'Interactive cooking shows where viewers can ask questions in real-time.',
      timeToTrend: '2-4 weeks',
      examples: [
        { creator: '@OTKCooking', views: '8K avg', engagement: '22%' },
        { creator: '@JuliaTv', views: '3K avg', engagement: '19%' }
      ]
    },
    {
      id: 'tw-trend-4',
      title: 'Variety Gaming Marathons',
      category: 'Gaming',
      platform: 'twitch',
      trendScore: 90,
      growth: 45,
      viewsEstimate: '3K-30K concurrent',
      competition: 'medium',
      hashtags: ['variety', 'marathon', 'gaming', '24hour'],
      description: 'Extended streams playing multiple games keep viewers engaged for hours.',
      timeToTrend: 'Planned events',
      examples: [
        { creator: '@LIRIK', views: '25K avg', engagement: '16%' },
        { creator: '@CohhCarnage', views: '15K avg', engagement: '14%' }
      ]
    }
  ]
};

export const trendingFormats = {
  shortForm: [
    {
      format: 'Quick Tutorials',
      description: 'Sub-60 second how-tos',
      platforms: ['tiktok', 'youtube', 'instagram'],
      growth: 65
    },
    {
      format: 'Before & After',
      description: 'Transformation content',
      platforms: ['tiktok', 'instagram'],
      growth: 58
    },
    {
      format: 'Day in Life',
      description: 'Compressed daily vlogs',
      platforms: ['tiktok', 'youtube', 'instagram'],
      growth: 52
    },
    {
      format: 'Product Reviews',
      description: 'Quick honest reviews',
      platforms: ['tiktok', 'youtube'],
      growth: 48
    }
  ],
  longForm: [
    {
      format: 'Video Essays',
      description: 'Deep dives into topics',
      platforms: ['youtube'],
      growth: 42
    },
    {
      format: 'Podcast Clips',
      description: 'Highlight reels from podcasts',
      platforms: ['youtube', 'tiktok'],
      growth: 55
    },
    {
      format: 'Documentary Style',
      description: 'Professional storytelling',
      platforms: ['youtube'],
      growth: 38
    },
    {
      format: 'Live Reactions',
      description: 'Real-time commentary',
      platforms: ['twitch', 'youtube'],
      growth: 45
    }
  ]
};

export const seasonalOpportunities = {
  january: ['New Year resolutions', 'Winter activities', 'Organization tips'],
  february: ["Valentine's Day", 'Black History Month', 'Winter fashion'],
  march: ['Spring cleaning', "St. Patrick's Day", 'March Madness'],
  april: ['Easter', 'Spring fashion', 'Earth Day prep'],
  may: ["Mother's Day", 'Graduation', 'Summer prep'],
  june: ["Father's Day", 'Pride Month', 'Summer activities'],
  july: ['Independence Day', 'Summer travel', 'BBQ season'],
  august: ['Back to school', 'Late summer trips', 'Fall prep'],
  september: ['Fall fashion', 'Halloween prep', 'Apple picking'],
  october: ['Halloween', 'Fall activities', 'Thanksgiving prep'],
  november: ['Thanksgiving', 'Black Friday', 'Holiday prep'],
  december: ['Holiday content', 'Year review', 'Gift guides']
};