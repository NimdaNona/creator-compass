import type { Platform, Roadmap, Template, ContentIdea } from '@/types';

// Data imports
import platformsData from '@/data/platforms.json';
import roadmapsData from '@/data/roadmaps.json';
import templatesData from '@/data/templates.json';
import bestPracticesData from '@/data/bestPractices.json';

// Platforms data - convert array to object keyed by ID
const platformsArray = platformsData.platforms as Platform[];
export const platforms: Record<string, Platform> = platformsArray.reduce((acc, platform) => {
  acc[platform.id] = platform;
  return acc;
}, {} as Record<string, Platform>);

// Get all platforms as array
export const getAllPlatforms = (): Platform[] => {
  return platformsArray;
};

// Get platform by ID
export const getPlatformById = (id: string): Platform | undefined => {
  return platforms[id];
};

// Get niches for a platform
export const getNichesForPlatform = (platformId: string) => {
  const platform = getPlatformById(platformId);
  return platform?.niches || [];
};

// Get niche by platform and niche ID
export const getNicheById = (platformId: string, nicheId: string) => {
  const niches = getNichesForPlatform(platformId);
  return niches.find(niche => niche.id === nicheId);
};

// Roadmaps data
export const roadmaps: any = roadmapsData.roadmaps;

// Get roadmap for platform and niche
export const getRoadmap = (platformId: string, nicheId: string): Roadmap | undefined => {
  return roadmaps[platformId]?.[nicheId];
};

// Get phase from roadmap
export const getPhase = (platformId: string, nicheId: string, phaseNumber: number) => {
  const roadmap = getRoadmap(platformId, nicheId);
  return roadmap?.phases.find(phase => phase.phase === phaseNumber);
};

// Get week from phase
export const getWeek = (platformId: string, nicheId: string, phaseNumber: number, weekNumber: number) => {
  const phase = getPhase(platformId, nicheId, phaseNumber);
  return phase?.weeks?.find(week => week.week === weekNumber);
};

// Get tasks for a specific week
export const getTasksForWeek = (platformId: string, nicheId: string, phaseNumber: number, weekNumber: number) => {
  const week = getWeek(platformId, nicheId, phaseNumber, weekNumber);
  return week?.dailyTasks || [];
};

// Get all tasks for a roadmap (flattened)
export const getAllTasksForRoadmap = (platformId: string, nicheId: string) => {
  const roadmap = getRoadmap(platformId, nicheId);
  if (!roadmap) return [];
  
  const allTasks = [];
  for (const phase of roadmap.phases) {
    if (phase.weeks) {
      for (const week of phase.weeks) {
        allTasks.push(...week.dailyTasks);
      }
    }
  }
  return allTasks;
};

// Templates data
export const templates: any = templatesData.templates;

// Get bio templates for platform and niche
export const getBioTemplates = (platformId: string, nicheId?: string) => {
  const platformTemplates = templates.bios[platformId];
  if (!platformTemplates) return [];
  
  if (nicheId && platformTemplates[nicheId]) {
    return platformTemplates[nicheId];
  }
  
  // Return all templates for the platform if no niche specified
  return Object.values(platformTemplates).flat();
};

// Get content ideas for platform and niche
export const getContentIdeas = (platformId: string, nicheId?: string): ContentIdea[] => {
  const platformIdeas = templates.content_ideas[platformId];
  if (!platformIdeas) return [];
  
  if (nicheId && platformIdeas[nicheId]) {
    return platformIdeas[nicheId] as ContentIdea[];
  }
  
  // Return all ideas for the platform if no niche specified
  return Object.values(platformIdeas).flat() as ContentIdea[];
};

// Get posting schedule for platform and experience level
export const getPostingSchedule = (platformId: string, level: 'beginner' | 'intermediate' = 'beginner') => {
  return templates.schedules[platformId]?.[level];
};

// Get captions for platform and niche
export const getCaptions = (platformId: string, nicheId?: string) => {
  const platformCaptions = templates.captions[platformId];
  if (!platformCaptions) return [];
  
  if (nicheId && platformCaptions[nicheId]) {
    return platformCaptions[nicheId];
  }
  
  // Return all captions for the platform
  return Object.values(platformCaptions).flat();
};

// Get hashtags for platform and niche
export const getHashtags = (platformId: string, nicheId?: string) => {
  const platformHashtags = templates.hashtags[platformId];
  if (!platformHashtags) return [];
  
  if (nicheId && platformHashtags[nicheId]) {
    return platformHashtags[nicheId];
  }
  
  // Return all hashtags for the platform
  return Object.values(platformHashtags).flat();
};

// Best practices data
export const bestPractices: any = bestPracticesData.bestPractices;

// Get algorithm tips for platform
export const getAlgorithmTips = (platformId: string) => {
  return bestPractices[platformId]?.algorithm;
};

// Get SEO best practices for platform
export const getSEOTips = (platformId: string) => {
  return bestPractices[platformId]?.seo;
};

// Get content strategy for platform
export const getContentStrategy = (platformId: string) => {
  return bestPractices[platformId]?.content_strategy;
};

// Get technical optimization tips for platform
export const getTechnicalTips = (platformId: string) => {
  return bestPractices[platformId]?.technical_optimization;
};

// Get monetization information
export const getMonetizationInfo = () => {
  return bestPractices.monetization;
};

// Get cross-platform strategies
export const getCrossPlatformStrategies = () => {
  return bestPractices.cross_platform;
};

// Get analytics best practices
export const getAnalyticsTips = () => {
  return bestPractices.analytics;
};

// Utility functions for progress calculation
export const calculateProgress = (completedTasks: string[], totalTasks: number) => {
  return totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;
};

export const calculatePhaseProgress = (platformId: string, nicheId: string, phaseNumber: number, completedTasks: string[]) => {
  const phase = getPhase(platformId, nicheId, phaseNumber);
  if (!phase?.weeks) return 0;
  
  const phaseTasks = phase.weeks.flatMap(week => week.dailyTasks);
  const completedPhaseTasks = phaseTasks.filter(task => completedTasks.includes(task.id));
  
  return calculateProgress(completedPhaseTasks.map(t => t.id), phaseTasks.length);
};

export const calculateWeekProgress = (platformId: string, nicheId: string, phaseNumber: number, weekNumber: number, completedTasks: string[]) => {
  const weekTasks = getTasksForWeek(platformId, nicheId, phaseNumber, weekNumber);
  const completedWeekTasks = weekTasks.filter(task => completedTasks.includes(task.id));
  
  return calculateProgress(completedWeekTasks.map(t => t.id), weekTasks.length);
};

// Get recommended next task
export const getNextTask = (platformId: string, nicheId: string, completedTasks: string[]) => {
  const allTasks = getAllTasksForRoadmap(platformId, nicheId);
  return allTasks.find(task => !completedTasks.includes(task.id));
};

// Get today's tasks (if following the roadmap chronologically)
export const getTodaysTasks = (platformId: string, nicheId: string, startDate: Date | string, completedTasks: string[]) => {
  const daysSinceStart = Math.floor((Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
  const currentDay = daysSinceStart + 1; // Day 1, 2, 3, etc.
  
  const allTasks = getAllTasksForRoadmap(platformId, nicheId);
  
  // Filter tasks for the current day based on dayRange
  return allTasks.filter(task => {
    if (task.dayRange.includes('Day ' + currentDay)) {
      return true;
    }
    if (task.dayRange === 'Daily' && !completedTasks.includes(task.id)) {
      return true;
    }
    return false;
  });
};

// Get tasks for current week
export const getCurrentWeekTasks = (platformId: string, nicheId: string, startDate: Date | string) => {
  const daysSinceStart = Math.floor((Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
  const currentWeek = Math.floor(daysSinceStart / 7) + 1;
  const currentPhase = Math.ceil(currentWeek / 4); // Assuming 4 weeks per phase
  
  return getTasksForWeek(platformId, nicheId, currentPhase, currentWeek);
};

// Search functions
export const searchContentIdeas = (query: string, platformId?: string) => {
  let ideas: ContentIdea[] = [];
  
  if (platformId) {
    ideas = Object.values(templates.content_ideas[platformId] || {}).flat() as ContentIdea[];
  } else {
    ideas = Object.values(templates.content_ideas)
      .flatMap(platform => Object.values(platform as any))
      .flat() as ContentIdea[];
  }
  
  return ideas.filter(idea =>
    idea.title.toLowerCase().includes(query.toLowerCase()) ||
    idea.description.toLowerCase().includes(query.toLowerCase())
  );
};

export const searchTemplates = (query: string, platformId?: string) => {
  let allTemplates: any[] = [];
  
  if (platformId) {
    const platformTemplates = templates.bios[platformId];
    if (platformTemplates) {
      allTemplates = Object.values(platformTemplates).flat();
    }
  } else {
    allTemplates = Object.values(templates.bios)
      .flatMap(platform => Object.values(platform as any))
      .flat();
  }
  
  return allTemplates.filter((template: any) =>
    template.template.toLowerCase().includes(query.toLowerCase())
  );
};