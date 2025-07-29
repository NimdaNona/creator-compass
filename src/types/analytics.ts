export interface AnalyticsData {
  id: string;
  userId: string;
  period: AnalyticsPeriod;
  metrics: ContentMetrics;
  platformMetrics: PlatformSpecificMetrics;
  audienceMetrics: AudienceMetrics;
  engagementMetrics: EngagementMetrics;
  growthMetrics: GrowthMetrics;
  competitorAnalysis?: CompetitorAnalysis;
  trends: TrendAnalysis;
  recommendations: PerformanceRecommendation[];
  createdAt: Date;
  updatedAt: Date;
}

export type AnalyticsPeriod = {
  start: Date;
  end: Date;
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
};

export interface ContentMetrics {
  totalContent: number;
  publishedContent: number;
  scheduledContent: number;
  contentByType: Record<string, number>;
  contentByPlatform: Record<string, number>;
  topPerformingContent: ContentPerformance[];
  underperformingContent: ContentPerformance[];
  averageProductionTime: number; // in hours
  publishingFrequency: number; // posts per week
  contentQualityScore: number; // 0-100
}

export interface ContentPerformance {
  id: string;
  title: string;
  type: string;
  platform: string;
  publishedAt: Date;
  views: number;
  engagement: number;
  shares: number;
  revenue?: number;
  performanceScore: number; // 0-100
  thumbnail?: string;
}

export interface PlatformSpecificMetrics {
  youtube?: YouTubeMetrics;
  tiktok?: TikTokMetrics;
  twitch?: TwitchMetrics;
  instagram?: InstagramMetrics;
  twitter?: TwitterMetrics;
}

export interface YouTubeMetrics {
  subscribers: number;
  subscriberGrowth: number;
  views: number;
  watchTime: number; // in minutes
  averageViewDuration: number; // in seconds
  impressions: number;
  clickThroughRate: number;
  likes: number;
  comments: number;
  shares: number;
  estimatedRevenue: number;
  topVideos: ContentPerformance[];
  channelAnalytics: {
    videosPublished: number;
    shortsPublished: number;
    livesHosted: number;
    communityPosts: number;
  };
}

export interface TikTokMetrics {
  followers: number;
  followerGrowth: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  averageWatchTime: number;
  completionRate: number;
  viralVideos: ContentPerformance[];
  hashtagPerformance: HashtagPerformance[];
}

export interface TwitchMetrics {
  followers: number;
  subscribers: number;
  averageViewers: number;
  peakViewers: number;
  streamTime: number; // in hours
  chatMessages: number;
  bitsReceived: number;
  subscriptionRevenue: number;
  donationRevenue: number;
  topStreams: StreamPerformance[];
  categoryPerformance: CategoryPerformance[];
}

export interface InstagramMetrics {
  followers: number;
  following: number;
  posts: number;
  reels: number;
  stories: number;
  engagement: number;
  reach: number;
  impressions: number;
  websiteClicks: number;
  profileVisits: number;
  topPosts: ContentPerformance[];
}

export interface TwitterMetrics {
  followers: number;
  following: number;
  tweets: number;
  impressions: number;
  engagements: number;
  retweets: number;
  likes: number;
  replies: number;
  profileVisits: number;
  topTweets: ContentPerformance[];
}

export interface AudienceMetrics {
  totalAudience: number;
  audienceGrowth: number;
  audienceGrowthRate: number; // percentage
  demographics: {
    age: Record<string, number>;
    gender: Record<string, number>;
    location: Record<string, number>;
    interests: Record<string, number>;
    devices: Record<string, number>;
  };
  activeAudience: number;
  engagementRate: number;
  audienceRetention: number;
  audienceLifetimeValue: number;
  topFans: Fan[];
}

export interface Fan {
  id: string;
  username: string;
  platform: string;
  engagementScore: number;
  totalInteractions: number;
  firstInteraction: Date;
  lastInteraction: Date;
  isPremiumSupporter: boolean;
}

export interface EngagementMetrics {
  totalEngagements: number;
  engagementRate: number;
  averageEngagementPerPost: number;
  engagementByType: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    clicks: number;
  };
  engagementByTime: TimeBasedMetric[];
  engagementByDay: DayBasedMetric[];
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface GrowthMetrics {
  followerGrowth: TimeSeriesData[];
  viewsGrowth: TimeSeriesData[];
  engagementGrowth: TimeSeriesData[];
  revenueGrowth: TimeSeriesData[];
  projectedGrowth: {
    followers: ProjectedMetric;
    views: ProjectedMetric;
    engagement: ProjectedMetric;
    revenue: ProjectedMetric;
  };
  growthVelocity: number;
  timeToMilestone: {
    nextFollowerMilestone: number;
    milestoneName: string;
    estimatedDate: Date;
  };
}

export interface TimeSeriesData {
  date: Date;
  value: number;
  change: number;
  changePercentage: number;
}

export interface ProjectedMetric {
  current: number;
  projected30Days: number;
  projected90Days: number;
  projected1Year: number;
  confidence: number; // 0-100
}

export interface CompetitorAnalysis {
  competitors: Competitor[];
  marketPosition: {
    rank: number;
    totalCompetitors: number;
    percentile: number;
  };
  competitiveAdvantages: string[];
  improvementAreas: string[];
  benchmarks: {
    followerGrowth: BenchmarkComparison;
    engagementRate: BenchmarkComparison;
    contentFrequency: BenchmarkComparison;
    contentQuality: BenchmarkComparison;
  };
}

export interface Competitor {
  id: string;
  name: string;
  platform: string;
  followers: number;
  engagementRate: number;
  contentFrequency: number;
  estimatedRevenue?: number;
  strengths: string[];
  weaknesses: string[];
  recentActivity: ContentPerformance[];
}

export interface BenchmarkComparison {
  yourValue: number;
  competitorAverage: number;
  topPerformer: number;
  percentile: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface TrendAnalysis {
  contentTrends: ContentTrend[];
  audienceTrends: AudienceTrend[];
  platformTrends: PlatformTrend[];
  seasonalTrends: SeasonalTrend[];
  emergingOpportunities: Opportunity[];
}

export interface ContentTrend {
  type: string;
  trend: 'rising' | 'stable' | 'declining';
  momentum: number; // -100 to 100
  examples: string[];
  recommendation: string;
}

export interface AudienceTrend {
  segment: string;
  growth: number;
  engagement: number;
  potential: 'high' | 'medium' | 'low';
  actionItems: string[];
}

export interface PlatformTrend {
  platform: string;
  feature: string;
  adoption: number;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface SeasonalTrend {
  period: string;
  historicalPerformance: number;
  predictedPerformance: number;
  contentSuggestions: string[];
}

export interface Opportunity {
  id: string;
  type: 'content' | 'platform' | 'collaboration' | 'monetization';
  title: string;
  description: string;
  potentialImpact: {
    followers: number;
    engagement: number;
    revenue?: number;
  };
  difficulty: 'easy' | 'medium' | 'hard';
  timeToImplement: number; // in days
  priority: 'high' | 'medium' | 'low';
}

export interface PerformanceRecommendation {
  id: string;
  category: 'content' | 'timing' | 'engagement' | 'platform' | 'monetization';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  priority: number; // 1-10
  actionItems: string[];
  expectedResults: {
    metric: string;
    currentValue: number;
    expectedValue: number;
    timeframe: number; // in days
  }[];
  examples?: {
    title: string;
    description: string;
    result: string;
  }[];
}

export interface HashtagPerformance {
  hashtag: string;
  uses: number;
  views: number;
  engagement: number;
  trend: 'rising' | 'stable' | 'declining';
}

export interface StreamPerformance {
  id: string;
  title: string;
  category: string;
  date: Date;
  duration: number; // in minutes
  averageViewers: number;
  peakViewers: number;
  newFollowers: number;
  revenue: number;
}

export interface CategoryPerformance {
  category: string;
  streams: number;
  averageViewers: number;
  totalHours: number;
  growthRate: number;
}

export interface TimeBasedMetric {
  hour: number;
  value: number;
  percentage: number;
}

export interface DayBasedMetric {
  day: string;
  value: number;
  percentage: number;
}

// Analytics event tracking types
export interface AnalyticsEvent {
  id: string;
  eventType: 'view' | 'engagement' | 'content_published' | 'follower_change' | 'revenue';
  userId: string;
  platform: string;
  contentId?: string;
  contentType?: string;
  value?: number;
  metadata?: Record<string, any>;
  timestamp: Date;
}

// Real-time analytics types
export interface RealTimeAnalytics {
  currentViewers: number;
  activeEngagements: number;
  recentActions: RealTimeAction[];
  trendingContent: string[];
  liveMetrics: {
    viewsPerMinute: number;
    engagementsPerMinute: number;
    sharesPerMinute: number;
  };
}

export interface RealTimeAction {
  id: string;
  type: 'view' | 'like' | 'comment' | 'share' | 'follow' | 'subscribe';
  platform: string;
  contentId?: string;
  contentTitle?: string;
  userId?: string;
  username?: string;
  timestamp: Date;
  value?: number;
}

// Analytics export types
export interface AnalyticsExport {
  format: 'pdf' | 'csv' | 'json' | 'excel';
  period: AnalyticsPeriod;
  sections: AnalyticsSection[];
  includeCharts: boolean;
  includeRecommendations: boolean;
  brandingOptions?: {
    logo?: string;
    primaryColor?: string;
    companyName?: string;
  };
}

export type AnalyticsSection = 
  | 'overview'
  | 'content-performance'
  | 'audience-insights'
  | 'engagement-analysis'
  | 'growth-metrics'
  | 'competitor-analysis'
  | 'trends'
  | 'recommendations';

// Analytics filter types
export interface AnalyticsFilters {
  platforms?: string[];
  contentTypes?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  metrics?: string[];
  comparison?: {
    enabled: boolean;
    periodType: 'previous' | 'year-over-year' | 'custom';
    customPeriod?: AnalyticsPeriod;
  };
}