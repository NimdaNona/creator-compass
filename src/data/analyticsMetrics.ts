export interface MetricDefinition {
  name: string;
  description: string;
  importance: 'critical' | 'important' | 'useful';
  optimizationTips: string[];
}

export interface PlatformMetrics {
  platform: string;
  metrics: MetricDefinition[];
  tools: {
    name: string;
    description: string;
    link: string;
  }[];
}

export const platformMetrics: PlatformMetrics[] = [
  {
    platform: 'YouTube',
    metrics: [
      {
        name: 'Average View Duration',
        description: 'How long viewers watch your videos on average',
        importance: 'critical',
        optimizationTips: [
          'Hook viewers in the first 15 seconds',
          'Use pattern interrupts every 30-60 seconds',
          'Add chapters for easy navigation',
          'Tease upcoming content throughout the video'
        ]
      },
      {
        name: 'Click-Through Rate (CTR)',
        description: 'Percentage of people who click your video after seeing the thumbnail',
        importance: 'critical',
        optimizationTips: [
          'A/B test different thumbnails',
          'Use contrasting colors and clear text',
          'Show faces with strong emotions',
          'Create curiosity gaps in titles'
        ]
      },
      {
        name: 'Audience Retention',
        description: 'Percentage of video watched over time',
        importance: 'critical',
        optimizationTips: [
          'Analyze drop-off points and improve those sections',
          'Front-load value in your videos',
          'Remove unnecessary intros',
          'Use visual variety to maintain interest'
        ]
      },
      {
        name: 'Impressions',
        description: 'How often YouTube shows your video to viewers',
        importance: 'important',
        optimizationTips: [
          'Optimize video metadata (title, description, tags)',
          'Upload consistently to train the algorithm',
          'Target specific keywords in your niche',
          'Encourage engagement to boost impressions'
        ]
      },
      {
        name: 'Watch Time',
        description: 'Total minutes watched across all videos',
        importance: 'critical',
        optimizationTips: [
          'Create longer videos that maintain retention',
          'Build playlists to increase session duration',
          'Use end screens to promote more content',
          'Create binge-worthy series'
        ]
      }
    ],
    tools: [
      {
        name: 'YouTube Studio',
        description: 'Official analytics dashboard with real-time data',
        link: 'studio.youtube.com'
      },
      {
        name: 'TubeBuddy',
        description: 'Browser extension for optimization and competitor analysis',
        link: 'tubebuddy.com'
      },
      {
        name: 'VidIQ',
        description: 'SEO tools and trending topic discovery',
        link: 'vidiq.com'
      }
    ]
  },
  {
    platform: 'TikTok',
    metrics: [
      {
        name: 'Completion Rate',
        description: 'Percentage of viewers who watch your entire video',
        importance: 'critical',
        optimizationTips: [
          'Keep videos under 30 seconds for higher completion',
          'Start with the payoff, then explain',
          'Use quick cuts and transitions',
          'End with a strong call-to-action'
        ]
      },
      {
        name: 'Share Rate',
        description: 'How often your video is shared relative to views',
        importance: 'critical',
        optimizationTips: [
          'Create relatable or surprising content',
          'Use trending sounds strategically',
          'Make content that starts conversations',
          'Include share-worthy moments'
        ]
      },
      {
        name: 'Profile View Rate',
        description: 'Percentage of viewers who visit your profile',
        importance: 'important',
        optimizationTips: [
          'Tease other content in your videos',
          'Build curiosity about your profile',
          'Create consistent content themes',
          'Use compelling bio and profile setup'
        ]
      },
      {
        name: 'Follow Rate',
        description: 'Percentage of profile visitors who follow',
        importance: 'important',
        optimizationTips: [
          'Maintain consistent posting schedule',
          'Create series-based content',
          'Show personality and authenticity',
          'Pin your best performing video'
        ]
      },
      {
        name: 'Engagement Rate',
        description: 'Combined likes, comments, and shares per view',
        importance: 'critical',
        optimizationTips: [
          'Ask questions to encourage comments',
          'Create duet-able or stitch-able content',
          'Respond to comments quickly',
          'Use polls and interactive features'
        ]
      }
    ],
    tools: [
      {
        name: 'TikTok Analytics',
        description: 'Built-in analytics for Pro accounts',
        link: 'tiktok.com/analytics'
      },
      {
        name: 'Analisa.io',
        description: 'Competitor analysis and hashtag tracking',
        link: 'analisa.io'
      },
      {
        name: 'TokBoard',
        description: 'Advanced analytics and reporting',
        link: 'tokboard.com'
      }
    ]
  },
  {
    platform: 'Instagram',
    metrics: [
      {
        name: 'Reach',
        description: 'Unique accounts that saw your content',
        importance: 'important',
        optimizationTips: [
          'Use 10-15 relevant hashtags per post',
          'Post during peak audience hours',
          'Create shareable content (quotes, tips)',
          'Use location tags for local discovery'
        ]
      },
      {
        name: 'Story Retention',
        description: 'How many people watch your stories to completion',
        importance: 'important',
        optimizationTips: [
          'Keep stories under 15 seconds each',
          'Use interactive stickers (polls, questions)',
          'Post stories consistently',
          'Create story highlights for evergreen content'
        ]
      },
      {
        name: 'Saves',
        description: 'How often posts are saved for later',
        importance: 'critical',
        optimizationTips: [
          'Create educational or reference content',
          'Use carousel posts for higher saves',
          'Include valuable tips or tutorials',
          'Design aesthetically pleasing posts'
        ]
      },
      {
        name: 'Profile Visits',
        description: 'Number of times your profile is viewed',
        importance: 'important',
        optimizationTips: [
          'Optimize bio with clear value proposition',
          'Use consistent visual branding',
          'Include strong call-to-action in bio',
          'Update story highlights regularly'
        ]
      },
      {
        name: 'DM Shares',
        description: 'How often posts are shared via direct message',
        importance: 'important',
        optimizationTips: [
          'Create meme-worthy content',
          'Share relatable experiences',
          'Use trending audio strategically',
          'Design quotable content'
        ]
      }
    ],
    tools: [
      {
        name: 'Instagram Insights',
        description: 'Native analytics for business accounts',
        link: 'instagram.com'
      },
      {
        name: 'Later',
        description: 'Scheduling and analytics platform',
        link: 'later.com'
      },
      {
        name: 'Iconosquare',
        description: 'Advanced Instagram analytics and reporting',
        link: 'iconosquare.com'
      }
    ]
  }
];

export const universalMetrics = {
  growthIndicators: [
    'Follower growth rate (aim for 5-10% monthly)',
    'Engagement rate relative to follower count',
    'Content virality frequency',
    'Audience retention trends',
    'Cross-platform growth correlation'
  ],
  warningSignals: [
    'Declining average views over 30 days',
    'Engagement rate below 2%',
    'High unfollow rate after posting',
    'Decreasing impression share',
    'Stagnant subscriber growth for 60+ days'
  ],
  pivotIndicators: [
    'One content type significantly outperforms others',
    'Audience demographics shift from target',
    'Competitor content performs better in your niche',
    'Platform algorithm changes affect reach',
    'Seasonal content performs unexpectedly well'
  ]
};

export const analyticsWorkflow = {
  daily: [
    'Check real-time performance of latest content',
    'Respond to comments and messages',
    'Monitor trending topics in your niche',
    'Track competitor uploads'
  ],
  weekly: [
    'Review top performing content patterns',
    'Analyze audience retention graphs',
    'Check demographic changes',
    'Plan content based on insights',
    'A/B test results review'
  ],
  monthly: [
    'Deep dive into growth metrics',
    'Content audit (what worked/what didn\'t)',
    'Competitor analysis',
    'Platform strategy adjustment',
    'Goal setting for next month'
  ]
};