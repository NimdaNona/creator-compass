export interface CommunityStrategy {
  stage: 'small' | 'medium' | 'large';
  audienceSize: string;
  strategies: string[];
  tools: string[];
  challenges: string[];
}

export const communityStrategies: CommunityStrategy[] = [
  {
    stage: 'small',
    audienceSize: '0-1K followers',
    strategies: [
      'Reply to every comment personally',
      'Remember regular viewers by name',
      'Create inside jokes with early supporters',
      'Host intimate Q&A sessions',
      'Give shoutouts to active community members',
      'Ask for direct feedback on content ideas'
    ],
    tools: [
      'Native platform comments',
      'Instagram DMs for super fans',
      'Small Discord server (under 50 members)',
      'Personal email list'
    ],
    challenges: [
      'Building initial momentum',
      'Feeling like talking to no one',
      'Maintaining motivation',
      'Finding your first core fans'
    ]
  },
  {
    stage: 'medium',
    audienceSize: '1K-10K followers',
    strategies: [
      'Create community traditions (weekly events)',
      'Develop channel-specific memes/language',
      'Feature community content/fan art',
      'Host regular live streams for interaction',
      'Create community challenges',
      'Establish clear community values'
    ],
    tools: [
      'Discord server with multiple channels',
      'Community tab (YouTube)',
      'Telegram groups',
      'Monthly newsletter',
      'Polls and surveys'
    ],
    challenges: [
      'Scaling personal interaction',
      'Managing growing Discord/communities',
      'Dealing with first trolls',
      'Maintaining authentic connection'
    ]
  },
  {
    stage: 'large',
    audienceSize: '10K+ followers',
    strategies: [
      'Hire community moderators',
      'Create tiered engagement systems',
      'Host virtual/physical meetups',
      'Develop community-driven content',
      'Launch community merchandise',
      'Create fan recognition programs'
    ],
    tools: [
      'Full moderation team',
      'Community management platforms',
      'Patreon or membership sites',
      'Professional Discord with bots',
      'Forum or subreddit'
    ],
    challenges: [
      'Preventing toxic behavior',
      'Maintaining culture at scale',
      'Balancing automation with personality',
      'Managing parasocial relationships'
    ]
  }
];

export const discordSetup = {
  essentialChannels: [
    { name: 'welcome', description: 'Rules and server info' },
    { name: 'announcements', description: 'Important updates' },
    { name: 'general', description: 'Main community chat' },
    { name: 'content-chat', description: 'Discuss your content' },
    { name: 'off-topic', description: 'Non-content related chat' },
    { name: 'self-promo', description: 'Community member content' }
  ],
  recommendedRoles: [
    { name: 'Moderator', color: '#E91E63', permissions: ['Manage Messages', 'Kick Members'] },
    { name: 'VIP/Supporter', color: '#FFD700', permissions: ['Custom emoji', 'Priority support'] },
    { name: 'Active Member', color: '#4CAF50', permissions: ['Create threads'] },
    { name: 'New Member', color: '#9E9E9E', permissions: ['Basic chat'] }
  ],
  automationBots: [
    { name: 'MEE6', purpose: 'Leveling system and moderation' },
    { name: 'Dyno', purpose: 'Auto-moderation and custom commands' },
    { name: 'Carl-bot', purpose: 'Reaction roles and announcements' },
    { name: 'Ticket Tool', purpose: 'Support ticket system' }
  ],
  communityGuidelines: [
    'Be respectful to all members',
    'No spam or self-promotion outside designated channels',
    'Keep content appropriate (follow platform TOS)',
    'No harassment or hate speech',
    'English only in main channels (create language-specific channels if needed)',
    'No sharing of personal information'
  ]
};

export const engagementTactics = {
  comments: {
    strategies: [
      'Ask questions at the end of content',
      'Create comment games ("Wrong answers only")',
      'Pin interesting discussions',
      'Heart comments from supporters',
      'Reply within first hour for algorithm boost'
    ],
    templates: [
      'What would you do in this situation?',
      'Drop a [emoji] if you agree!',
      'What should I try next?',
      'Share your experience with...',
      'Tag someone who needs to see this!'
    ]
  },
  liveStreams: {
    interactive: [
      'Viewer game nights',
      'Q&A sessions',
      'Behind the scenes streams',
      'Community celebrations',
      'Collaborative content creation'
    ],
    tips: [
      'Acknowledge new viewers by name',
      'Create recurring segments',
      'Use stream alerts effectively',
      'Have moderators help with chat',
      'End with clear next stream info'
    ]
  },
  challenges: {
    types: [
      'Creative challenges (fan art, memes)',
      'Gameplay challenges',
      'Fitness/lifestyle challenges',
      'Educational challenges',
      'Charity fundraising challenges'
    ],
    rewards: [
      'Feature in next video',
      'Discord role upgrade',
      'Exclusive content access',
      'Merchandise discount',
      'Direct collaboration opportunity'
    ]
  }
};

export const responseTemplates = {
  positiveComments: [
    "Thank you so much! This means a lot! 💕",
    "I'm so glad you enjoyed this! What was your favorite part?",
    "You're amazing! Thanks for the support! 🙌",
    "This comment made my day! Thank you!",
    "So happy this helped you! Let me know if you have questions!"
  ],
  constructiveCriticism: [
    "Thanks for the feedback! I'll definitely consider this for future videos.",
    "I appreciate you taking the time to share this. Always looking to improve!",
    "Valid point! What would you like to see instead?",
    "Thanks for keeping it constructive. This helps me grow!",
    "I hear you! Will work on this moving forward."
  ],
  trollsAndHate: [
    "[Don't respond - Delete/Block/Report]",
    "[If mild] Hope you have a better day! 🌟",
    "[Pin positive comment instead of engaging]",
    "[Have moderators handle it]",
    "[Screenshot for evidence if severe]"
  ],
  frequentQuestions: {
    equipment: "I've linked all my gear in the description! Check it out!",
    schedule: "I upload every [day] at [time]! Turn on notifications!",
    collaboration: "Thanks for the interest! Please email [business email]",
    tutorial: "Great idea! I'll add it to my content list!",
    personal: "I prefer to keep that private, but thanks for caring!"
  }
};

export const moderatorGuidelines = {
  selection: [
    'Choose long-time active community members',
    'Look for positive, helpful personalities',
    'Ensure coverage across time zones',
    'Start with trial periods',
    'Provide clear expectations document'
  ],
  responsibilities: [
    'Remove spam and inappropriate content',
    'Welcome new members',
    'Facilitate discussions',
    'Escalate serious issues',
    'Help enforce community guidelines'
  ],
  rewards: [
    'Special Discord role and permissions',
    'Early access to content',
    'Direct line of communication',
    'Mod-only channels and events',
    'Potential paid positions for large communities'
  ],
  redFlags: [
    'Power-hungry behavior',
    'Favoritism or bias',
    'Breaking confidentiality',
    'Inactive for extended periods',
    'Creating drama within mod team'
  ]
};

export const communityMetrics = {
  health: [
    'Active members vs total members ratio',
    'Message frequency in community spaces',
    'Positive vs negative sentiment ratio',
    'Member retention rate',
    'New member integration success'
  ],
  growth: [
    'Community member increase rate',
    'Engagement rate growth',
    'User-generated content frequency',
    'Community event participation',
    'Cross-platform community presence'
  ],
  warning: [
    'Increasing negative comments',
    'Declining active participation',
    'Mod team burnout signs',
    'Spam increase',
    'Community fragmentation'
  ]
};