export interface PlatformConnection {
  id: string;
  userId: string;
  platform: PlatformType;
  accountId: string;
  accountName: string;
  accountImage?: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  scopes: string[];
  isActive: boolean;
  lastSync?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type PlatformType = 
  | 'youtube' 
  | 'tiktok' 
  | 'instagram' 
  | 'twitter' 
  | 'twitch'
  | 'linkedin'
  | 'facebook';

export interface PlatformAuth {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
}

export interface PlatformContent {
  id: string;
  platformId: string;
  platform: PlatformType;
  title: string;
  description?: string;
  content?: string;
  type: ContentType;
  status: ContentStatus;
  scheduledFor?: Date;
  publishedAt?: Date;
  url?: string;
  thumbnail?: string;
  metrics?: ContentMetrics;
  tags?: string[];
  hashtags?: string[];
  mentions?: string[];
  location?: string;
  metadata?: Record<string, any>;
}

export type ContentType = 
  | 'video' 
  | 'short' 
  | 'image' 
  | 'carousel' 
  | 'text' 
  | 'story' 
  | 'reel'
  | 'live'
  | 'article';

export type ContentStatus = 
  | 'draft' 
  | 'scheduled' 
  | 'publishing' 
  | 'published' 
  | 'failed' 
  | 'deleted';

export interface ContentMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves?: number;
  impressions?: number;
  reach?: number;
  engagementRate?: number;
  watchTime?: number;
  clickThroughRate?: number;
}

export interface PlatformAnalytics {
  platform: PlatformType;
  connectionId: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    followers: number;
    followersGrowth: number;
    totalViews: number;
    totalEngagement: number;
    avgEngagementRate: number;
    totalContent: number;
    topContent: PlatformContent[];
  };
  audienceData?: {
    demographics: Record<string, any>;
    topLocations: string[];
    activeHours: number[];
  };
}

export interface ContentSchedule {
  id: string;
  userId: string;
  connectionId: string;
  platform: PlatformType;
  content: {
    title: string;
    description?: string;
    media?: MediaUpload[];
    tags?: string[];
    hashtags?: string[];
    mentions?: string[];
  };
  scheduledFor: Date;
  timezone: string;
  status: 'pending' | 'processing' | 'published' | 'failed' | 'cancelled';
  retryCount: number;
  error?: string;
  publishedId?: string;
  publishedUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaUpload {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  thumbnail?: string;
  duration?: number;
  size: number;
  mimeType: string;
  metadata?: {
    width?: number;
    height?: number;
    aspectRatio?: string;
    framerate?: number;
    bitrate?: number;
  };
}

export interface PlatformLimits {
  platform: PlatformType;
  content: {
    titleMaxLength?: number;
    descriptionMaxLength?: number;
    tagsMax?: number;
    hashtagsMax?: number;
    mentionsMax?: number;
    mediaMax?: number;
    videoMaxDuration?: number;
    videoMaxSize?: number;
    imageMaxSize?: number;
    supportedFormats: string[];
  };
  posting: {
    dailyLimit?: number;
    hourlyLimit?: number;
    minInterval?: number; // in minutes
  };
}

export interface PlatformService {
  connect(authCode: string): Promise<PlatformConnection>;
  disconnect(connectionId: string): Promise<void>;
  refreshToken(connection: PlatformConnection): Promise<PlatformConnection>;
  validateConnection(connection: PlatformConnection): Promise<boolean>;
  
  // Content operations
  publishContent(connectionId: string, content: Partial<PlatformContent>): Promise<PlatformContent>;
  scheduleContent(connectionId: string, content: Partial<ContentSchedule>): Promise<ContentSchedule>;
  updateContent(connectionId: string, contentId: string, updates: Partial<PlatformContent>): Promise<PlatformContent>;
  deleteContent(connectionId: string, contentId: string): Promise<void>;
  getContent(connectionId: string, contentId: string): Promise<PlatformContent>;
  listContent(connectionId: string, options?: ListOptions): Promise<PlatformContent[]>;
  
  // Analytics operations
  getAnalytics(connectionId: string, period: { start: Date; end: Date }): Promise<PlatformAnalytics>;
  syncAnalytics(connectionId: string): Promise<void>;
  
  // Platform-specific operations
  getPlatformLimits(): PlatformLimits;
  validateContent(content: Partial<PlatformContent>): ValidationResult;
}

export interface ListOptions {
  limit?: number;
  offset?: number;
  status?: ContentStatus[];
  type?: ContentType[];
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'date' | 'views' | 'engagement';
  sortOrder?: 'asc' | 'desc';
}

export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
  warnings?: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

// OAuth types
export interface OAuthState {
  platform: PlatformType;
  userId: string;
  redirectUrl?: string;
  scopes?: string[];
  state: string;
  createdAt: Date;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn?: number;
  scope?: string;
}

// Webhook types for platform events
export interface PlatformWebhook {
  id: string;
  platform: PlatformType;
  connectionId: string;
  event: WebhookEvent;
  payload: Record<string, any>;
  signature?: string;
  receivedAt: Date;
  processed: boolean;
  error?: string;
}

export type WebhookEvent = 
  | 'content.published'
  | 'content.deleted'
  | 'content.updated'
  | 'comment.received'
  | 'follower.new'
  | 'mention.received'
  | 'livestream.started'
  | 'livestream.ended';

// Cross-platform posting
export interface CrossPlatformPost {
  id: string;
  userId: string;
  title: string;
  content: {
    [K in PlatformType]?: {
      enabled: boolean;
      connectionId?: string;
      adaptedContent?: Partial<PlatformContent>;
      scheduledFor?: Date;
      status?: ContentStatus;
    };
  };
  media: MediaUpload[];
  originalPlatform?: PlatformType;
  createdAt: Date;
  updatedAt: Date;
}