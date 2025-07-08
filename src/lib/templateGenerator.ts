import { templates } from '@/data/templates.json';
import { Platform, Niche } from '@/types';

export interface GeneratedBio {
  id: string;
  content: string;
  variables: string[];
  platform: string;
  niche: string;
}

export interface GeneratedContentIdea {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  viralityPotential: string;
  estimatedTime: number;
  equipment: string[];
  tips: string[];
  platform: string;
  niche: string;
}

export interface GeneratedSchedule {
  platform: string;
  level: string;
  frequency: string;
  optimalDays: string[];
  optimalTimes: string[];
  timeZone: string;
  contentTypes: Record<string, string>;
  weeklyPlan?: Record<string, string>;
  duration?: string;
  contentStrategy?: string;
}

export interface HashtagStrategy {
  platform: string;
  niche: string;
  trending: string[];
  niche_specific: string[];
  broad: string[];
  strategy: string;
  optimal_count: number;
}

// Bio Generator
export function generateBio(
  platform: string, 
  niche: string, 
  userPreferences?: {
    name?: string;
    location?: string;
    goal?: string;
    schedule?: string;
    personality?: string;
  }
): GeneratedBio | null {
  const platformBios = templates.bios[platform as keyof typeof templates.bios];
  if (!platformBios) return null;

  const nicheBios = platformBios[niche as keyof typeof platformBios] as any[];
  if (!nicheBios || nicheBios.length === 0) return null;

  // Pick a random template
  const randomTemplate = nicheBios[Math.floor(Math.random() * nicheBios.length)] as any;
  
  let content = randomTemplate.template;
  
  // Apply basic auto-fill if user preferences are provided
  if (userPreferences) {
    if (userPreferences.name) {
      content = content.replace(/\[Your Name\]/g, userPreferences.name);
      content = content.replace(/\[Channel Name\]/g, `${userPreferences.name}'s Channel`);
    }
    if (userPreferences.location) {
      content = content.replace(/\[Location\]/g, userPreferences.location);
    }
    if (userPreferences.goal) {
      content = content.replace(/\[Current Goal\]/g, userPreferences.goal);
      content = content.replace(/\[Follower Goal\]/g, userPreferences.goal);
    }
    if (userPreferences.schedule) {
      content = content.replace(/\[Upload Schedule\]/g, userPreferences.schedule);
      content = content.replace(/\[Stream Schedule\]/g, userPreferences.schedule);
    }
    if (userPreferences.personality) {
      content = content.replace(/\[Personality Trait\]/g, userPreferences.personality);
      content = content.replace(/\[Personality Description\]/g, userPreferences.personality);
    }
  }

  return {
    id: randomTemplate.id,
    content,
    variables: randomTemplate.variables,
    platform,
    niche
  };
}

// Content Ideas Generator
export function generateContentIdeas(
  platform: string, 
  niche: string, 
  count: number = 5
): GeneratedContentIdea[] {
  const platformIdeas = templates.content_ideas[platform as keyof typeof templates.content_ideas];
  if (!platformIdeas) return [];

  const nicheIdeas = platformIdeas[niche as keyof typeof platformIdeas] as any[];
  if (!nicheIdeas || nicheIdeas.length === 0) return [];

  // Shuffle and take random ideas
  const shuffled = [...nicheIdeas].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map((idea: any) => ({
    ...idea,
    platform,
    niche
  }));
}

// Advanced Content Ideas with variations
export function generateAdvancedContentIdeas(
  platform: string,
  niche: string,
  userPreferences: {
    experience_level?: 'beginner' | 'intermediate' | 'advanced';
    content_style?: 'educational' | 'entertainment' | 'promotional';
    target_audience?: string;
  },
  count: number = 10
): GeneratedContentIdea[] {
  const baseIdeas = generateContentIdeas(platform, niche, count);
  
  // Generate variations based on user preferences
  const variations: GeneratedContentIdea[] = [];
  
  baseIdeas.forEach((idea, index) => {
    // Create variations of each idea
    const baseVariation = { ...idea };
    
    if (userPreferences.experience_level === 'beginner') {
      baseVariation.title = `Beginner's Guide: ${idea.title}`;
      baseVariation.difficulty = 'Easy';
      baseVariation.tips = [...idea.tips, 'Start simple and build confidence', 'Don\'t worry about perfection'];
    } else if (userPreferences.experience_level === 'advanced') {
      baseVariation.title = `Advanced ${idea.title} Strategies`;
      baseVariation.difficulty = 'Hard';
      baseVariation.tips = [...idea.tips, 'Push creative boundaries', 'Experiment with new techniques'];
    }
    
    variations.push(baseVariation);
    
    // Add style-specific variations
    if (userPreferences.content_style === 'educational' && variations.length < count) {
      variations.push({
        ...idea,
        id: `${idea.id}_edu`,
        title: `How To: ${idea.title}`,
        description: `Educational breakdown: ${idea.description}`,
        tips: [...idea.tips, 'Explain step-by-step', 'Include helpful resources', 'Answer common questions']
      });
    }
    
    if (userPreferences.content_style === 'entertainment' && variations.length < count) {
      variations.push({
        ...idea,
        id: `${idea.id}_fun`,
        title: `${idea.title} (But Make It Fun!)`,
        description: `Entertaining take: ${idea.description}`,
        viralityPotential: 'High',
        tips: [...idea.tips, 'Add humor and personality', 'Include trending elements', 'Make it shareable']
      });
    }
  });
  
  return variations.slice(0, count);
}

// Schedule Generator
export function generateSchedule(
  platform: string, 
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
): GeneratedSchedule | null {
  const platformSchedules = templates.schedules[platform as keyof typeof templates.schedules];
  if (!platformSchedules) return null;

  const schedule = platformSchedules[experienceLevel as keyof typeof platformSchedules] as any;
  if (!schedule) return null;

  return {
    platform,
    level: experienceLevel,
    frequency: schedule.frequency || '',
    optimalDays: schedule.optimalDays || [],
    optimalTimes: schedule.optimalTimes || [],
    timeZone: schedule.timeZone || 'Your local timezone',
    contentTypes: schedule.contentTypes || {},
    weeklyPlan: schedule.weeklyPlan,
    duration: schedule.duration,
    contentStrategy: schedule.contentStrategy
  };
}

// Hashtag Strategy Generator
export function generateHashtagStrategy(
  platform: string, 
  niche: string,
  contentType?: string
): HashtagStrategy | null {
  const platformHashtags = templates.hashtags[platform as keyof typeof templates.hashtags];
  if (!platformHashtags) return null;

  const nicheHashtags = platformHashtags[niche as keyof typeof platformHashtags];
  if (!nicheHashtags) return null;

  // Get trending hashtags (simulated - in real app would be from API)
  const trendingHashtags = ['viral', 'trending', 'fyp', 'explore', 'new'];
  
  // Mix of niche-specific and broad hashtags
  const broadHashtags = ['creative', 'content', 'creator', 'community', 'follow'];
  
  let strategy = '';
  let optimalCount = 5;
  
  if (platform === 'youtube') {
    strategy = 'Use 5-8 relevant hashtags in your description. Mix broad and niche-specific tags.';
    optimalCount = 7;
  } else if (platform === 'tiktok') {
    strategy = 'Use 3-5 hashtags max. Focus on trending and niche-specific tags.';
    optimalCount = 4;
  } else if (platform === 'twitch') {
    strategy = 'Use relevant hashtags in your stream title and description to improve discoverability.';
    optimalCount = 5;
  }

  return {
    platform,
    niche,
    trending: trendingHashtags.slice(0, 3),
    niche_specific: Array.isArray(nicheHashtags) ? (nicheHashtags as string[]).slice(0, 5) : [],
    broad: broadHashtags.slice(0, 3),
    strategy,
    optimal_count: optimalCount
  };
}

// Caption Generator
export function generateCaption(
  platform: string,
  niche: string,
  contentTitle?: string
): string | null {
  const platformCaptions = templates.captions[platform as keyof typeof templates.captions];
  if (!platformCaptions) return null;

  const nicheCaptions = platformCaptions[niche as keyof typeof platformCaptions] as string[];
  if (!nicheCaptions || nicheCaptions.length === 0) return null;

  // Pick a random caption
  const randomCaption = nicheCaptions[Math.floor(Math.random() * nicheCaptions.length)];
  
  // Replace placeholders if content title is provided
  let caption = randomCaption;
  if (contentTitle) {
    caption = caption.replace(/\[Game Name\]/g, contentTitle);
    caption = caption.replace(/\[Product Name\]/g, contentTitle);
    caption = caption.replace(/\[Specific Moment\]/g, 'that epic moment');
    caption = caption.replace(/\[Time\]/g, '30 minutes');
  }
  
  return caption;
}

// Complete Template Package Generator
export function generateCompleteTemplatePackage(
  platform: string,
  niche: string,
  userPreferences?: {
    name?: string;
    location?: string;
    goal?: string;
    schedule?: string;
    personality?: string;
    experience_level?: 'beginner' | 'intermediate' | 'advanced';
    content_style?: 'educational' | 'entertainment' | 'promotional';
  }
) {
  const bio = generateBio(platform, niche, userPreferences);
  const contentIdeas = generateAdvancedContentIdeas(
    platform, 
    niche, 
    {
      experience_level: userPreferences?.experience_level || 'beginner',
      content_style: userPreferences?.content_style || 'entertainment'
    },
    8
  );
  const schedule = generateSchedule(platform, userPreferences?.experience_level || 'beginner');
  const hashtagStrategy = generateHashtagStrategy(platform, niche);
  const sampleCaption = generateCaption(platform, niche);

  return {
    bio,
    contentIdeas,
    schedule,
    hashtagStrategy,
    sampleCaption,
    platform,
    niche,
    generatedAt: new Date().toISOString()
  };
}