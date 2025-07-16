import { ChatCompletionUsage } from 'openai/resources/chat/completions';

export interface AIResponse {
  content: string;
  usage?: ChatCompletionUsage;
  model?: string;
}

export interface AIStreamResponse {
  content: string;
  done: boolean;
}

export type ContentGenerationType = 
  | 'bio'
  | 'content-idea'
  | 'caption'
  | 'script-outline'
  | 'thumbnail-concept'
  | 'title'
  | 'description'
  | 'hashtags'
  | 'hook'
  | 'call-to-action'
  | 'channel-description'
  | 'video-tags';

export interface PromptTemplate {
  systemPrompt: string;
  userPromptTemplate: string;
  temperature: number;
  maxTokens: number;
  buildPrompt: (context: Record<string, any>) => string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface AIConversation {
  id: string;
  userId: string;
  messages: ConversationMessage[];
  context: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeneratedContent {
  id: string;
  userId: string;
  type: ContentGenerationType;
  prompt: string;
  content: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface UserAIProfile {
  creatorLevel: 'beginner' | 'intermediate' | 'advanced';
  equipment: Equipment[];
  goals: string[];
  challenges: string[];
  timeCommitment: string;
  preferredPlatforms: string[];
  contentNiche: string;
  personalityTraits?: string[];
  contentStyle?: string;
}

export interface Equipment {
  name: string;
  category: 'camera' | 'audio' | 'lighting' | 'computer' | 'software' | 'other';
  owned: boolean;
  plannedPurchase?: boolean;
}

export interface AIRecommendation {
  id: string;
  type: 'equipment' | 'content' | 'strategy' | 'task';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  actionItems?: string[];
  estimatedImpact?: string;
  timeframe?: string;
}

export interface AIAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  recommendations: AIRecommendation[];
  nextSteps: string[];
}

export interface ContentContext {
  platform: 'youtube' | 'tiktok' | 'twitch';
  niche: string;
  targetAudience?: string;
  tone?: 'professional' | 'casual' | 'humorous' | 'educational' | 'inspirational';
  keywords?: string[];
  length?: 'short' | 'medium' | 'long';
  style?: string;
  additionalContext?: string;
}

export interface TaskPrioritization {
  taskId: string;
  priority: number;
  reason: string;
  estimatedTime: number;
  dependencies?: string[];
}

export interface DynamicRoadmap {
  id: string;
  userId: string;
  phases: RoadmapPhase[];
  customizedFor: UserAIProfile;
  generatedAt: Date;
  adjustments: RoadmapAdjustment[];
}

export interface RoadmapPhase {
  phase: number;
  title: string;
  description: string;
  duration: string;
  goals: string[];
  tasks: DynamicTask[];
  milestones: string[];
}

export interface DynamicTask {
  id: string;
  title: string;
  description: string;
  personalized: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  timeEstimate: number;
  category: string;
  aiGenerated: boolean;
  rationale?: string;
  resources?: string[];
  tips?: string[];
}

export interface RoadmapAdjustment {
  date: Date;
  reason: string;
  changes: string[];
  impact: 'minor' | 'moderate' | 'major';
}