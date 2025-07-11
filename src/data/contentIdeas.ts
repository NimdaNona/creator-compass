export interface ContentIdea {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  resources: string;
  viralityPotential: 'low' | 'medium' | 'high';
  category: string;
  contentType: string;
  keywords: string[];
}

export interface NicheContentIdeas {
  beginner: ContentIdea[];
  intermediate: ContentIdea[];
  advanced: ContentIdea[];
}

export const contentIdeasByNiche: Record<string, NicheContentIdeas> = {
  gaming: {
    beginner: [
      {
        id: 'gaming-beginner-1',
        title: "Let's Play a Popular Game Casually",
        description: 'Record or stream a relaxed "Let\'s Play" of a trending game, providing commentary as you experience it. Let\'s Play videos remain incredibly popular and are a good way to start building an audience with personality-driven content.',
        difficulty: 'easy',
        resources: 'Basic gaming setup',
        viralityPotential: 'medium',
        category: 'evergreen',
        contentType: 'video',
        keywords: ['lets play', 'gaming', 'commentary', 'casual']
      },
      {
        id: 'gaming-beginner-2',
        title: 'First Impressions of a New Release',
        description: 'Play a brand-new game on launch day and share your first reactions. New releases often have high search volume and curiosity factor.',
        difficulty: 'easy',
        resources: 'Game copy',
        viralityPotential: 'high',
        category: 'trending',
        contentType: 'video',
        keywords: ['new release', 'first impressions', 'review', 'launch day']
      },
      {
        id: 'gaming-beginner-3',
        title: 'Game Trailer Reaction',
        description: 'React to a just-released game trailer or announcement. Reaction videos to major announcements tap into trending hype.',
        difficulty: 'easy',
        resources: 'Webcam/screen capture',
        viralityPotential: 'high',
        category: 'trending',
        contentType: 'video',
        keywords: ['reaction', 'trailer', 'announcement', 'gaming news']
      },
      {
        id: 'gaming-beginner-4',
        title: 'Top 5 Free Games This Month',
        description: 'Make a short list video highlighting free-to-play games currently popular or newly released.',
        difficulty: 'easy',
        resources: 'None beyond gameplay capture',
        viralityPotential: 'medium',
        category: 'evergreen',
        contentType: 'video',
        keywords: ['free games', 'top 5', 'recommendations', 'f2p']
      },
      {
        id: 'gaming-beginner-5',
        title: 'Retro Gaming Nostalgia Stream',
        description: 'Stream or record yourself playing a classic old-school game and talk about why it was great.',
        difficulty: 'easy',
        resources: 'Emulator or old console',
        viralityPotential: 'medium',
        category: 'evergreen',
        contentType: 'stream',
        keywords: ['retro', 'nostalgia', 'classic', 'old school']
      }
    ],
    intermediate: [
      {
        id: 'gaming-intermediate-1',
        title: 'In-Depth Game Review & Critique',
        description: 'Create a comprehensive review of a game after thoroughly playing it. Discuss story, gameplay, graphics, pros/cons.',
        difficulty: 'medium',
        resources: 'Game completed, editing software',
        viralityPotential: 'medium',
        category: 'evergreen',
        contentType: 'video',
        keywords: ['review', 'critique', 'analysis', 'in-depth']
      },
      {
        id: 'gaming-intermediate-2',
        title: 'Full Game Walkthrough Series',
        description: 'Start a complete walkthrough series for a game, covering it level by level with commentary and tips.',
        difficulty: 'medium',
        resources: 'Time to record series',
        viralityPotential: 'medium',
        category: 'evergreen',
        contentType: 'series',
        keywords: ['walkthrough', 'guide', 'tutorial', 'series']
      },
      {
        id: 'gaming-intermediate-3',
        title: 'Gaming Tutorials (Advanced Tips)',
        description: 'Produce tutorial videos that focus on specific advanced techniques or strategies in a game.',
        difficulty: 'medium',
        resources: 'Expertise in game',
        viralityPotential: 'high',
        category: 'educational',
        contentType: 'video',
        keywords: ['tutorial', 'advanced', 'tips', 'strategy']
      },
      {
        id: 'gaming-intermediate-4',
        title: 'Speedrun Challenge',
        description: 'Attempt a serious speedrun or challenge run for a well-known game, aiming for a respectable time.',
        difficulty: 'medium',
        resources: 'Timer, practice',
        viralityPotential: 'high',
        category: 'trending',
        contentType: 'stream',
        keywords: ['speedrun', 'challenge', 'competitive', 'timer']
      },
      {
        id: 'gaming-intermediate-5',
        title: 'Collaboration Multiplayer Session',
        description: 'Collaborate with fellow creators to play a multiplayer game together.',
        difficulty: 'medium',
        resources: 'Coordinate with other streamers',
        viralityPotential: 'high',
        category: 'entertainment',
        contentType: 'stream',
        keywords: ['collab', 'multiplayer', 'crossover', 'community']
      }
    ],
    advanced: [
      {
        id: 'gaming-advanced-1',
        title: 'Host a Major Tournament',
        description: 'Organize a large-scale gaming tournament with prizes and multiple participants.',
        difficulty: 'hard',
        resources: 'Significant coordination & prizes',
        viralityPotential: 'high',
        category: 'entertainment',
        contentType: 'stream',
        keywords: ['tournament', 'esports', 'competition', 'event']
      },
      {
        id: 'gaming-advanced-2',
        title: '24-Hour Marathon Stream',
        description: 'Attempt an extended marathon stream of 24 hours continuous gaming.',
        difficulty: 'hard',
        resources: 'Endurance and streaming setup',
        viralityPotential: 'high',
        category: 'entertainment',
        contentType: 'stream',
        keywords: ['marathon', '24hour', 'endurance', 'challenge']
      },
      {
        id: 'gaming-advanced-3',
        title: 'World Record Attempt',
        description: 'Go after a world record in a game - speedrun or high score.',
        difficulty: 'hard',
        resources: 'Exceptional skill & practice',
        viralityPotential: 'high',
        category: 'trending',
        contentType: 'stream',
        keywords: ['world record', 'speedrun', 'achievement', 'pro']
      },
      {
        id: 'gaming-advanced-4',
        title: 'Produce a Machinima',
        description: 'Use a game engine to create a short film or story.',
        difficulty: 'hard',
        resources: 'Scripting, voice actors, heavy editing',
        viralityPotential: 'medium',
        category: 'entertainment',
        contentType: 'video',
        keywords: ['machinima', 'creative', 'film', 'story']
      },
      {
        id: 'gaming-advanced-5',
        title: 'Interactive Stream with Custom Tech',
        description: 'Develop a way for viewers to directly affect your game via chat.',
        difficulty: 'hard',
        resources: 'Coding/tech skills',
        viralityPotential: 'high',
        category: 'trending',
        contentType: 'stream',
        keywords: ['interactive', 'chat plays', 'custom', 'tech']
      }
    ]
  },
  beauty: {
    beginner: [
      {
        id: 'beauty-beginner-1',
        title: '5-Minute Everyday Makeup',
        description: 'Quick and simple makeup routine perfect for beginners or busy mornings.',
        difficulty: 'easy',
        resources: 'Basic makeup products',
        viralityPotential: 'high',
        category: 'evergreen',
        contentType: 'video',
        keywords: ['quick makeup', 'everyday', 'simple', 'beginner']
      },
      {
        id: 'beauty-beginner-2',
        title: 'Drugstore Makeup Haul',
        description: 'Review affordable makeup products from drugstore brands.',
        difficulty: 'easy',
        resources: 'Drugstore products',
        viralityPotential: 'medium',
        category: 'trending',
        contentType: 'video',
        keywords: ['drugstore', 'affordable', 'haul', 'budget']
      },
      {
        id: 'beauty-beginner-3',
        title: 'First Impressions Review',
        description: 'Try new products for the first time and share immediate thoughts.',
        difficulty: 'easy',
        resources: 'New products to test',
        viralityPotential: 'medium',
        category: 'trending',
        contentType: 'video',
        keywords: ['first impressions', 'review', 'new products', 'testing']
      },
      {
        id: 'beauty-beginner-4',
        title: 'Skincare Routine for Beginners',
        description: 'Basic skincare steps explained simply for those starting out.',
        difficulty: 'easy',
        resources: 'Basic skincare products',
        viralityPotential: 'high',
        category: 'educational',
        contentType: 'video',
        keywords: ['skincare', 'routine', 'beginner', 'basics']
      },
      {
        id: 'beauty-beginner-5',
        title: 'Testing Viral Beauty Hacks',
        description: 'Try popular beauty hacks from TikTok and Instagram.',
        difficulty: 'easy',
        resources: 'Items for hacks',
        viralityPotential: 'high',
        category: 'trending',
        contentType: 'short',
        keywords: ['viral hacks', 'testing', 'tiktok', 'trends']
      }
    ],
    intermediate: [
      {
        id: 'beauty-intermediate-1',
        title: 'Full Glam Transformation',
        description: 'Complete makeup transformation from natural to full glam.',
        difficulty: 'medium',
        resources: 'Full makeup collection',
        viralityPotential: 'high',
        category: 'entertainment',
        contentType: 'video',
        keywords: ['transformation', 'full glam', 'makeup', 'dramatic']
      },
      {
        id: 'beauty-intermediate-2',
        title: 'Recreating Celebrity Looks',
        description: 'Tutorial recreating iconic celebrity makeup looks.',
        difficulty: 'medium',
        resources: 'Reference photos, varied products',
        viralityPotential: 'high',
        category: 'trending',
        contentType: 'video',
        keywords: ['celebrity', 'recreation', 'tutorial', 'iconic']
      },
      {
        id: 'beauty-intermediate-3',
        title: 'Seasonal Makeup Collection',
        description: 'Create looks inspired by current season trends.',
        difficulty: 'medium',
        resources: 'Seasonal color palette',
        viralityPotential: 'medium',
        category: 'seasonal',
        contentType: 'series',
        keywords: ['seasonal', 'trends', 'collection', 'themed']
      },
      {
        id: 'beauty-intermediate-4',
        title: 'Brand Comparison Battle',
        description: 'Compare similar products from different brands.',
        difficulty: 'medium',
        resources: 'Multiple brand products',
        viralityPotential: 'medium',
        category: 'educational',
        contentType: 'video',
        keywords: ['comparison', 'battle', 'review', 'brands']
      },
      {
        id: 'beauty-intermediate-5',
        title: 'Live Makeup Q&A Tutorial',
        description: 'Live stream doing makeup while answering viewer questions.',
        difficulty: 'medium',
        resources: 'Streaming setup',
        viralityPotential: 'medium',
        category: 'educational',
        contentType: 'stream',
        keywords: ['live', 'Q&A', 'tutorial', 'interactive']
      }
    ],
    advanced: [
      {
        id: 'beauty-advanced-1',
        title: 'Special Effects Makeup',
        description: 'Create dramatic special effects looks for events or holidays.',
        difficulty: 'hard',
        resources: 'SFX products and tools',
        viralityPotential: 'high',
        category: 'seasonal',
        contentType: 'video',
        keywords: ['SFX', 'special effects', 'dramatic', 'creative']
      },
      {
        id: 'beauty-advanced-2',
        title: 'Launch Your Own Product Line',
        description: 'Document the journey of creating beauty products.',
        difficulty: 'hard',
        resources: 'Product development resources',
        viralityPotential: 'high',
        category: 'entertainment',
        contentType: 'series',
        keywords: ['product launch', 'brand', 'business', 'behind scenes']
      },
      {
        id: 'beauty-advanced-3',
        title: 'Professional Masterclass Series',
        description: 'In-depth professional techniques taught step-by-step.',
        difficulty: 'hard',
        resources: 'Professional knowledge and equipment',
        viralityPotential: 'medium',
        category: 'educational',
        contentType: 'series',
        keywords: ['masterclass', 'professional', 'advanced', 'techniques']
      },
      {
        id: 'beauty-advanced-4',
        title: 'Collaborate with Celebrities',
        description: 'Do makeup for or with celebrity guests.',
        difficulty: 'hard',
        resources: 'Celebrity connections',
        viralityPotential: 'high',
        category: 'entertainment',
        contentType: 'video',
        keywords: ['celebrity', 'collab', 'exclusive', 'guest']
      },
      {
        id: 'beauty-advanced-5',
        title: 'Host Beauty Convention Coverage',
        description: 'Attend and cover major beauty conventions and events.',
        difficulty: 'hard',
        resources: 'Travel and press access',
        viralityPotential: 'high',
        category: 'trending',
        contentType: 'video',
        keywords: ['convention', 'event', 'coverage', 'exclusive']
      }
    ]
  },
  tech: {
    beginner: [
      {
        id: 'tech-beginner-1',
        title: 'Unboxing Latest Gadgets',
        description: 'Unbox and give first impressions of new tech products.',
        difficulty: 'easy',
        resources: 'New tech product',
        viralityPotential: 'medium',
        category: 'trending',
        contentType: 'video',
        keywords: ['unboxing', 'first look', 'gadget', 'new']
      },
      {
        id: 'tech-beginner-2',
        title: 'Tech News Weekly Roundup',
        description: 'Summarize the biggest tech news of the week.',
        difficulty: 'easy',
        resources: 'Research time',
        viralityPotential: 'medium',
        category: 'trending',
        contentType: 'video',
        keywords: ['news', 'roundup', 'weekly', 'updates']
      },
      {
        id: 'tech-beginner-3',
        title: 'App Review and Tutorial',
        description: 'Review useful apps and show how to use them.',
        difficulty: 'easy',
        resources: 'Smartphone/computer',
        viralityPotential: 'medium',
        category: 'educational',
        contentType: 'video',
        keywords: ['app review', 'tutorial', 'how to', 'mobile']
      },
      {
        id: 'tech-beginner-4',
        title: 'Budget Tech Setup Tour',
        description: 'Show how to build a tech setup on a budget.',
        difficulty: 'easy',
        resources: 'Your own setup',
        viralityPotential: 'high',
        category: 'evergreen',
        contentType: 'video',
        keywords: ['budget', 'setup', 'affordable', 'tour']
      },
      {
        id: 'tech-beginner-5',
        title: 'Tech Tips in 60 Seconds',
        description: 'Quick tech tips and tricks in short-form content.',
        difficulty: 'easy',
        resources: 'Basic tech knowledge',
        viralityPotential: 'high',
        category: 'educational',
        contentType: 'short',
        keywords: ['tips', 'tricks', 'quick', 'shorts']
      }
    ],
    intermediate: [
      {
        id: 'tech-intermediate-1',
        title: 'Build a PC Step-by-Step',
        description: 'Complete guide to building a computer from scratch.',
        difficulty: 'medium',
        resources: 'PC components',
        viralityPotential: 'high',
        category: 'educational',
        contentType: 'video',
        keywords: ['PC build', 'tutorial', 'step-by-step', 'guide']
      },
      {
        id: 'tech-intermediate-2',
        title: 'Smart Home Automation Guide',
        description: 'Set up and optimize smart home devices and routines.',
        difficulty: 'medium',
        resources: 'Smart home devices',
        viralityPotential: 'medium',
        category: 'educational',
        contentType: 'series',
        keywords: ['smart home', 'automation', 'IoT', 'setup']
      },
      {
        id: 'tech-intermediate-3',
        title: 'Coding Tutorial Series',
        description: 'Teach programming concepts and projects.',
        difficulty: 'medium',
        resources: 'Programming knowledge',
        viralityPotential: 'medium',
        category: 'educational',
        contentType: 'series',
        keywords: ['coding', 'programming', 'tutorial', 'development']
      },
      {
        id: 'tech-intermediate-4',
        title: 'Tech Product Comparisons',
        description: 'In-depth comparisons of competing tech products.',
        difficulty: 'medium',
        resources: 'Multiple products',
        viralityPotential: 'high',
        category: 'evergreen',
        contentType: 'video',
        keywords: ['comparison', 'versus', 'review', 'analysis']
      },
      {
        id: 'tech-intermediate-5',
        title: 'Live Tech Support Stream',
        description: 'Help viewers solve tech problems in real-time.',
        difficulty: 'medium',
        resources: 'Tech expertise',
        viralityPotential: 'medium',
        category: 'educational',
        contentType: 'stream',
        keywords: ['live support', 'help', 'Q&A', 'troubleshooting']
      }
    ],
    advanced: [
      {
        id: 'tech-advanced-1',
        title: 'Create Your Own Tech Product',
        description: 'Document the process of developing a tech product.',
        difficulty: 'hard',
        resources: 'Development resources',
        viralityPotential: 'high',
        category: 'entertainment',
        contentType: 'series',
        keywords: ['product development', 'startup', 'innovation', 'build']
      },
      {
        id: 'tech-advanced-2',
        title: 'Advanced Cybersecurity Series',
        description: 'Deep dive into cybersecurity concepts and demonstrations.',
        difficulty: 'hard',
        resources: 'Security expertise',
        viralityPotential: 'medium',
        category: 'educational',
        contentType: 'series',
        keywords: ['cybersecurity', 'hacking', 'security', 'advanced']
      },
      {
        id: 'tech-advanced-3',
        title: 'Tech Conference Coverage',
        description: 'Attend and report from major tech conferences.',
        difficulty: 'hard',
        resources: 'Travel and press access',
        viralityPotential: 'high',
        category: 'trending',
        contentType: 'video',
        keywords: ['conference', 'event', 'coverage', 'exclusive']
      },
      {
        id: 'tech-advanced-4',
        title: 'Interview Tech Industry Leaders',
        description: 'Exclusive interviews with tech CEOs and innovators.',
        difficulty: 'hard',
        resources: 'Industry connections',
        viralityPotential: 'high',
        category: 'entertainment',
        contentType: 'video',
        keywords: ['interview', 'CEO', 'exclusive', 'industry']
      },
      {
        id: 'tech-advanced-5',
        title: 'Launch a Tech Podcast Network',
        description: 'Create a network of tech-focused podcasts.',
        difficulty: 'hard',
        resources: 'Production team',
        viralityPotential: 'medium',
        category: 'entertainment',
        contentType: 'series',
        keywords: ['podcast', 'network', 'audio', 'shows']
      }
    ]
  },
  entertainment: {
    beginner: [
      {
        id: 'entertainment-beginner-1',
        title: 'React to Viral Videos',
        description: 'Share your reactions to trending viral content.',
        difficulty: 'easy',
        resources: 'Screen recording',
        viralityPotential: 'high',
        category: 'trending',
        contentType: 'video',
        keywords: ['reaction', 'viral', 'trending', 'commentary']
      },
      {
        id: 'entertainment-beginner-2',
        title: 'Daily Vlog Challenge',
        description: 'Document your daily life for a week or month.',
        difficulty: 'easy',
        resources: 'Camera/phone',
        viralityPotential: 'medium',
        category: 'entertainment',
        contentType: 'series',
        keywords: ['vlog', 'daily', 'lifestyle', 'personal']
      },
      {
        id: 'entertainment-beginner-3',
        title: 'Comedy Skits on Trends',
        description: 'Create short comedy skits based on current trends.',
        difficulty: 'easy',
        resources: 'Basic props',
        viralityPotential: 'high',
        category: 'trending',
        contentType: 'short',
        keywords: ['comedy', 'skit', 'funny', 'trends']
      },
      {
        id: 'entertainment-beginner-4',
        title: 'Storytelling Session',
        description: 'Share interesting personal stories or experiences.',
        difficulty: 'easy',
        resources: 'Good stories',
        viralityPotential: 'medium',
        category: 'evergreen',
        contentType: 'video',
        keywords: ['storytime', 'personal', 'experience', 'narrative']
      },
      {
        id: 'entertainment-beginner-5',
        title: 'Challenge Yourself Series',
        description: 'Try different challenges each week.',
        difficulty: 'easy',
        resources: 'Challenge ideas',
        viralityPotential: 'medium',
        category: 'entertainment',
        contentType: 'series',
        keywords: ['challenge', 'try', 'experiment', 'fun']
      }
    ],
    intermediate: [
      {
        id: 'entertainment-intermediate-1',
        title: 'Prank Series with Friends',
        description: 'Create elaborate but harmless pranks.',
        difficulty: 'medium',
        resources: 'Planning and friends',
        viralityPotential: 'high',
        category: 'entertainment',
        contentType: 'video',
        keywords: ['prank', 'friends', 'funny', 'series']
      },
      {
        id: 'entertainment-intermediate-2',
        title: 'Host a Talk Show Format',
        description: 'Interview interesting people in talk show style.',
        difficulty: 'medium',
        resources: 'Guests and setup',
        viralityPotential: 'medium',
        category: 'entertainment',
        contentType: 'video',
        keywords: ['talk show', 'interview', 'guests', 'format']
      },
      {
        id: 'entertainment-intermediate-3',
        title: 'Create a Web Series',
        description: 'Develop an ongoing fictional series.',
        difficulty: 'medium',
        resources: 'Script and actors',
        viralityPotential: 'medium',
        category: 'entertainment',
        contentType: 'series',
        keywords: ['web series', 'fiction', 'drama', 'story']
      },
      {
        id: 'entertainment-intermediate-4',
        title: 'Music Video Parodies',
        description: 'Create funny parodies of popular music videos.',
        difficulty: 'medium',
        resources: 'Video editing skills',
        viralityPotential: 'high',
        category: 'trending',
        contentType: 'video',
        keywords: ['parody', 'music video', 'comedy', 'spoof']
      },
      {
        id: 'entertainment-intermediate-5',
        title: 'Live Game Show Stream',
        description: 'Host interactive game shows with viewer participation.',
        difficulty: 'medium',
        resources: 'Game show format',
        viralityPotential: 'medium',
        category: 'entertainment',
        contentType: 'stream',
        keywords: ['game show', 'live', 'interactive', 'prizes']
      }
    ],
    advanced: [
      {
        id: 'entertainment-advanced-1',
        title: 'Produce a Documentary',
        description: 'Create a full-length documentary on an interesting topic.',
        difficulty: 'hard',
        resources: 'Research and production',
        viralityPotential: 'high',
        category: 'educational',
        contentType: 'video',
        keywords: ['documentary', 'film', 'investigation', 'story']
      },
      {
        id: 'entertainment-advanced-2',
        title: 'Host a Live Event',
        description: 'Organize and stream a major live entertainment event.',
        difficulty: 'hard',
        resources: 'Venue and production',
        viralityPotential: 'high',
        category: 'entertainment',
        contentType: 'stream',
        keywords: ['live event', 'show', 'performance', 'exclusive']
      },
      {
        id: 'entertainment-advanced-3',
        title: 'Celebrity Collaboration Series',
        description: 'Partner with celebrities for exclusive content.',
        difficulty: 'hard',
        resources: 'Celebrity connections',
        viralityPotential: 'high',
        category: 'entertainment',
        contentType: 'series',
        keywords: ['celebrity', 'collab', 'exclusive', 'star']
      },
      {
        id: 'entertainment-advanced-4',
        title: 'Launch a Content Network',
        description: 'Build a network of creators under your brand.',
        difficulty: 'hard',
        resources: 'Business infrastructure',
        viralityPotential: 'medium',
        category: 'entertainment',
        contentType: 'series',
        keywords: ['network', 'brand', 'business', 'creators']
      },
      {
        id: 'entertainment-advanced-5',
        title: 'Create a Feature Film',
        description: 'Produce and release a full feature film.',
        difficulty: 'hard',
        resources: 'Film production resources',
        viralityPotential: 'high',
        category: 'entertainment',
        contentType: 'video',
        keywords: ['film', 'movie', 'feature', 'cinema']
      }
    ]
  },
  educational: {
    beginner: [
      {
        id: 'educational-beginner-1',
        title: 'Quick Facts Series',
        description: 'Share interesting facts in bite-sized videos.',
        difficulty: 'easy',
        resources: 'Research materials',
        viralityPotential: 'medium',
        category: 'educational',
        contentType: 'short',
        keywords: ['facts', 'trivia', 'quick', 'learn']
      },
      {
        id: 'educational-beginner-2',
        title: 'Book Summary Videos',
        description: 'Summarize popular books in engaging videos.',
        difficulty: 'easy',
        resources: 'Books to read',
        viralityPotential: 'medium',
        category: 'evergreen',
        contentType: 'video',
        keywords: ['book summary', 'review', 'reading', 'literature']
      },
      {
        id: 'educational-beginner-3',
        title: 'Language Learning Tips',
        description: 'Share tips for learning languages effectively.',
        difficulty: 'easy',
        resources: 'Language knowledge',
        viralityPotential: 'high',
        category: 'educational',
        contentType: 'video',
        keywords: ['language', 'learning', 'tips', 'education']
      },
      {
        id: 'educational-beginner-4',
        title: 'Study With Me Sessions',
        description: 'Live study sessions for motivation and company.',
        difficulty: 'easy',
        resources: 'Study materials',
        viralityPotential: 'medium',
        category: 'educational',
        contentType: 'stream',
        keywords: ['study', 'motivation', 'focus', 'productivity']
      },
      {
        id: 'educational-beginner-5',
        title: 'History Stories Series',
        description: 'Tell interesting historical stories engagingly.',
        difficulty: 'easy',
        resources: 'History research',
        viralityPotential: 'medium',
        category: 'evergreen',
        contentType: 'video',
        keywords: ['history', 'stories', 'past', 'educational']
      }
    ],
    intermediate: [
      {
        id: 'educational-intermediate-1',
        title: 'Online Course Creation',
        description: 'Develop comprehensive courses on your expertise.',
        difficulty: 'medium',
        resources: 'Course materials',
        viralityPotential: 'medium',
        category: 'educational',
        contentType: 'series',
        keywords: ['course', 'teaching', 'online', 'education']
      },
      {
        id: 'educational-intermediate-2',
        title: 'Science Experiment Series',
        description: 'Demonstrate fascinating science experiments.',
        difficulty: 'medium',
        resources: 'Lab equipment',
        viralityPotential: 'high',
        category: 'educational',
        contentType: 'video',
        keywords: ['science', 'experiment', 'demonstration', 'STEM']
      },
      {
        id: 'educational-intermediate-3',
        title: 'Documentary Style Lessons',
        description: 'Create mini-documentaries on educational topics.',
        difficulty: 'medium',
        resources: 'Research and production',
        viralityPotential: 'medium',
        category: 'educational',
        contentType: 'video',
        keywords: ['documentary', 'education', 'deep dive', 'learn']
      },
      {
        id: 'educational-intermediate-4',
        title: 'Virtual Field Trips',
        description: 'Take viewers on educational virtual tours.',
        difficulty: 'medium',
        resources: 'Travel or VR setup',
        viralityPotential: 'medium',
        category: 'educational',
        contentType: 'video',
        keywords: ['virtual tour', 'field trip', 'explore', 'travel']
      },
      {
        id: 'educational-intermediate-5',
        title: 'Expert Interview Series',
        description: 'Interview experts in various fields.',
        difficulty: 'medium',
        resources: 'Expert connections',
        viralityPotential: 'medium',
        category: 'educational',
        contentType: 'video',
        keywords: ['interview', 'expert', 'knowledge', 'insights']
      }
    ],
    advanced: [
      {
        id: 'educational-advanced-1',
        title: 'Launch an Online Academy',
        description: 'Build a full educational platform with multiple courses.',
        difficulty: 'hard',
        resources: 'Platform and content',
        viralityPotential: 'medium',
        category: 'educational',
        contentType: 'series',
        keywords: ['academy', 'platform', 'education', 'courses']
      },
      {
        id: 'educational-advanced-2',
        title: 'Research and Publish Studies',
        description: 'Conduct original research and share findings.',
        difficulty: 'hard',
        resources: 'Research capabilities',
        viralityPotential: 'medium',
        category: 'educational',
        contentType: 'video',
        keywords: ['research', 'study', 'academic', 'findings']
      },
      {
        id: 'educational-advanced-3',
        title: 'Educational Conference Host',
        description: 'Organize and host educational conferences.',
        difficulty: 'hard',
        resources: 'Event organization',
        viralityPotential: 'high',
        category: 'educational',
        contentType: 'stream',
        keywords: ['conference', 'education', 'summit', 'speakers']
      },
      {
        id: 'educational-advanced-4',
        title: 'Create Educational Games',
        description: 'Develop games that teach while entertaining.',
        difficulty: 'hard',
        resources: 'Game development',
        viralityPotential: 'high',
        category: 'educational',
        contentType: 'video',
        keywords: ['educational game', 'edutainment', 'interactive', 'learning']
      },
      {
        id: 'educational-advanced-5',
        title: 'Build a Learning Community',
        description: 'Create a thriving community of learners.',
        difficulty: 'hard',
        resources: 'Community platform',
        viralityPotential: 'medium',
        category: 'educational',
        contentType: 'series',
        keywords: ['community', 'learning', 'network', 'education']
      }
    ]
  }
};