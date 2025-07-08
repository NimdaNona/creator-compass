// Core platform types
export interface Platform {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  color: string;
  features: string[];
  requirements: {
    monetization: Record<string, string>;
    technical: Record<string, string>;
  };
  niches: Niche[];
}

export interface Niche {
  id: string;
  name: string;
  description: string;
  subcategories?: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  competitiveness: 'Low' | 'Medium' | 'High';
  avgTimeToMonetization: string;
}

// Roadmap types
export interface Roadmap {
  duration: string;
  phases: Phase[];
}

export interface Phase {
  id: string;
  phase: number;
  timeframe: string;
  title: string;
  description: string;
  goals: string[];
  weeks?: Week[];
}

export interface Week {
  id: string;
  week: number;
  title: string;
  dailyTasks: Task[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dayRange: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  estimatedTime: number;
  metadata?: Record<string, any>;
  relatedResources?: string[];
  dependencies?: string[];
}

// User and progress types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  subscription: 'free' | 'premium';
  createdAt: Date;
  lastActive: Date;
}

export interface UserProgress {
  userId: string;
  selectedPlatform: string;
  selectedNiche: string;
  currentPhase: number;
  currentWeek: number;
  startDate: Date;
  completedTasks: string[];
  streakDays: number;
  totalPoints: number;
  achievements: Achievement[];
  lastUpdated: Date;
  goals?: string[];
  targetTimeframe?: number;
  motivation?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  category: 'milestone' | 'streak' | 'special';
}

// Template types
export interface Template {
  id: string;
  title: string;
  template: string;
  variables: string[];
  example?: string;
  category: string;
  platform: string;
}

export interface ContentIdea {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  viralityPotential: 'Low' | 'Medium' | 'High';
  estimatedTime: number;
  equipment: string[];
  tips: string[];
}

// App state types
export interface AppState {
  user: User | null;
  selectedPlatform: string | null;
  selectedNiche: string | null;
  progress: UserProgress | null;
  onboardingComplete: boolean;
  theme: 'light' | 'dark';
}

// Onboarding types
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: string;
  required: boolean;
}

// Analytics types
export interface Analytics {
  views: number;
  engagement: number;
  followers: number;
  watchTime?: number;
  clickThroughRate?: number;
  conversionRate?: number;
  lastUpdated: Date;
}

// Business model types
export interface Subscription {
  plan: 'free' | 'premium';
  features: string[];
  limits: {
    platforms: number;
    roadmapDays: number;
    templatesAccess: boolean;
    analyticsAccess: boolean;
    prioritySupport: boolean;
  };
  price?: number;
}

export interface PaywallConfig {
  title: string;
  description: string;
  features: string[];
  ctaText: string;
  upgradeUrl: string;
}

// Component prop types
export interface ProgressCardProps {
  platform: string;
  niche: string;
  progress: UserProgress;
  onTaskComplete: (taskId: string) => void;
}

export interface RoadmapViewProps {
  roadmap: Roadmap;
  progress: UserProgress;
  onTaskComplete: (taskId: string) => void;
  readonly?: boolean;
}

export interface PlatformCardProps {
  platform: Platform;
  selected?: boolean;
  onClick: (platformId: string) => void;
}

export interface NicheCardProps {
  niche: Niche;
  selected?: boolean;
  onClick: (nicheId: string) => void;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Local storage types
export interface StorageKeys {
  USER_PROGRESS: string;
  ONBOARDING_STATE: string;
  THEME_PREFERENCE: string;
  SELECTED_PLATFORM: string;
  SELECTED_NICHE: string;
}

// Feature flags
export interface FeatureFlags {
  enableAnalytics: boolean;
  enableSocialShare: boolean;
  enableNotifications: boolean;
  enableOfflineMode: boolean;
  enableBetaFeatures: boolean;
}