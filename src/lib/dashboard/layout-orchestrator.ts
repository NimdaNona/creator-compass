import { UserContext, JourneyStage } from '@/lib/ai/journey-orchestrator';

export interface DashboardComponent {
  id: string;
  name: string;
  component: string;
  priority: number;
  visibility: 'always' | 'conditional' | 'hidden';
  conditions?: LayoutCondition[];
  gridSpan?: 'small' | 'medium' | 'large' | 'full';
  order?: number;
}

export interface LayoutCondition {
  type: 'stage' | 'progress' | 'time' | 'interaction' | 'feature';
  operator: 'equals' | 'greater' | 'less' | 'includes' | 'excludes';
  value: any;
  field?: string;
}

export interface DashboardLayout {
  components: DashboardComponent[];
  emphasis: 'onboarding' | 'growth' | 'optimization' | 'mastery';
  columns: 1 | 2 | 3;
}

export class LayoutOrchestrator {
  private defaultComponents: DashboardComponent[] = [
    {
      id: 'journey-guide',
      name: 'AI Journey Guide',
      component: 'AIJourneyGuide',
      priority: 10,
      visibility: 'always',
      gridSpan: 'full',
      order: 1
    },
    {
      id: 'welcome-banner',
      name: 'Welcome Banner',
      component: 'WelcomeBanner',
      priority: 9,
      visibility: 'conditional',
      conditions: [
        { type: 'progress', field: 'totalTasksCompleted', operator: 'less', value: 5 }
      ],
      gridSpan: 'full',
      order: 0
    },
    {
      id: 'achievements-banner',
      name: 'Achievements Banner',
      component: 'AchievementsBanner',
      priority: 8,
      visibility: 'conditional',
      conditions: [
        { type: 'progress', field: 'totalAchievements', operator: 'greater', value: 0 }
      ],
      gridSpan: 'full',
      order: 2
    },
    {
      id: 'progress-stats',
      name: 'Progress Stats',
      component: 'ProgressStats',
      priority: 9,
      visibility: 'always',
      gridSpan: 'full',
      order: 3
    },
    {
      id: 'todays-tasks',
      name: "Today's Tasks",
      component: 'TodaysTasks',
      priority: 10,
      visibility: 'always',
      gridSpan: 'large',
      order: 4
    },
    {
      id: 'task-recommendations',
      name: 'Dynamic Task Recommendations',
      component: 'DynamicTaskRecommendations',
      priority: 8,
      visibility: 'conditional',
      conditions: [
        { type: 'stage', operator: 'excludes', value: 'discovery' }
      ],
      gridSpan: 'full',
      order: 5
    },
    {
      id: 'quick-actions',
      name: 'Quick Actions',
      component: 'QuickActions',
      priority: 7,
      visibility: 'always',
      gridSpan: 'small',
      order: 6
    },
    {
      id: 'usage-widget',
      name: 'Usage Widget',
      component: 'UsageWidget',
      priority: 5,
      visibility: 'always',
      gridSpan: 'small',
      order: 7
    },
    {
      id: 'ai-insights',
      name: 'AI Insights',
      component: 'AIInsights',
      priority: 6,
      visibility: 'conditional',
      conditions: [
        { type: 'progress', field: 'totalTasksCompleted', operator: 'greater', value: 10 }
      ],
      gridSpan: 'small',
      order: 8
    },
    {
      id: 'content-calendar-preview',
      name: 'Calendar Preview',
      component: 'CalendarPreview',
      priority: 6,
      visibility: 'conditional',
      conditions: [
        { type: 'stage', operator: 'includes', value: ['foundation', 'growth', 'scale', 'mastery'] }
      ],
      gridSpan: 'medium',
      order: 9
    },
    {
      id: 'analytics-preview',
      name: 'Analytics Preview',
      component: 'AnalyticsPreview',
      priority: 5,
      visibility: 'conditional',
      conditions: [
        { type: 'stage', operator: 'includes', value: ['growth', 'scale', 'mastery'] }
      ],
      gridSpan: 'medium',
      order: 10
    },
    {
      id: 'community-feed',
      name: 'Community Feed',
      component: 'CommunityFeed',
      priority: 4,
      visibility: 'conditional',
      conditions: [
        { type: 'stage', operator: 'includes', value: ['growth', 'scale', 'mastery'] }
      ],
      gridSpan: 'medium',
      order: 11
    },
    {
      id: 'learning-path',
      name: 'Learning Path',
      component: 'LearningPath',
      priority: 7,
      visibility: 'conditional',
      conditions: [
        { type: 'stage', operator: 'includes', value: ['discovery', 'foundation'] }
      ],
      gridSpan: 'medium',
      order: 12
    },
    // Gamification components
    {
      id: 'xp-level-display',
      name: 'XP & Level',
      component: 'XPLevelDisplay',
      priority: 8,
      visibility: 'always',
      gridSpan: 'small',
      order: 4
    },
    {
      id: 'daily-challenges',
      name: 'Daily Challenges',
      component: 'DailyChallenges',
      priority: 9,
      visibility: 'always',
      gridSpan: 'medium',
      order: 5
    },
    // AI Features
    {
      id: 'ai-content-ideas',
      name: 'AI Content Ideas',
      component: 'ContentIdeaGenerator',
      priority: 7,
      visibility: 'conditional',
      conditions: [
        { type: 'stage', operator: 'includes', value: ['foundation', 'growth', 'scale', 'mastery'] }
      ],
      gridSpan: 'large',
      order: 13
    },
    {
      id: 'ai-script-writer',
      name: 'AI Script Writer',
      component: 'ScriptWriter',
      priority: 6,
      visibility: 'conditional',
      conditions: [
        { type: 'stage', operator: 'includes', value: ['foundation', 'growth', 'scale', 'mastery'] }
      ],
      gridSpan: 'large',
      order: 14
    },
    {
      id: 'ai-thumbnail-analyzer',
      name: 'Thumbnail Analyzer',
      component: 'ThumbnailAnalyzer',
      priority: 6,
      visibility: 'conditional',
      conditions: [
        { type: 'stage', operator: 'includes', value: ['foundation', 'growth', 'scale', 'mastery'] }
      ],
      gridSpan: 'large',
      order: 15
    },
    {
      id: 'ai-performance-predictor',
      name: 'Performance Predictor',
      component: 'PerformancePredictor',
      priority: 6,
      visibility: 'conditional',
      conditions: [
        { type: 'stage', operator: 'includes', value: ['growth', 'scale', 'mastery'] }
      ],
      gridSpan: 'large',
      order: 16
    },
    {
      id: 'ai-ab-testing',
      name: 'A/B Testing Advisor',
      component: 'ABTestingAdvisor',
      priority: 7,
      visibility: 'conditional',
      conditions: [
        { type: 'stage', operator: 'includes', value: ['growth', 'scale', 'mastery'] }
      ],
      gridSpan: 'large',
      order: 17
    },
    // Community & Collaboration Components
    {
      id: 'community-hub-preview',
      name: 'Community Hub',
      component: 'CommunityHubPreview',
      priority: 8,
      visibility: 'conditional',
      conditions: [
        { type: 'stage', operator: 'includes', value: ['foundation', 'growth', 'scale', 'mastery'] }
      ],
      gridSpan: 'medium',
      order: 18
    },
    {
      id: 'collaboration-opportunities',
      name: 'Collaboration Opportunities',
      component: 'CollaborationOpportunities',
      priority: 7,
      visibility: 'conditional',
      conditions: [
        { type: 'stage', operator: 'includes', value: ['growth', 'scale', 'mastery'] }
      ],
      gridSpan: 'medium',
      order: 19
    },
    {
      id: 'mentorship-matches',
      name: 'Mentorship Matches',
      component: 'MentorshipMatches',
      priority: 6,
      visibility: 'conditional',
      conditions: [
        { type: 'stage', operator: 'includes', value: ['foundation', 'growth', 'scale', 'mastery'] }
      ],
      gridSpan: 'small',
      order: 20
    },
    {
      id: 'community-events',
      name: 'Upcoming Events',
      component: 'CommunityEventsWidget',
      priority: 5,
      visibility: 'conditional',
      conditions: [
        { type: 'stage', operator: 'includes', value: ['foundation', 'growth', 'scale', 'mastery'] }
      ],
      gridSpan: 'small',
      order: 21
    },
    {
      id: 'active-challenges',
      name: 'Active Challenges',
      component: 'ActiveChallengesWidget',
      priority: 6,
      visibility: 'conditional',
      conditions: [
        { type: 'stage', operator: 'includes', value: ['foundation', 'growth', 'scale', 'mastery'] }
      ],
      gridSpan: 'medium',
      order: 22
    }
  ];

  generateDashboardLayout(
    context: UserContext,
    journeyStage: JourneyStage,
    interactions: any[]
  ): DashboardLayout {
    // Determine layout emphasis based on journey stage
    const emphasis = this.determineLayoutEmphasis(journeyStage, context);
    
    // Filter and prioritize components based on conditions
    const visibleComponents = this.filterComponentsByConditions(
      this.defaultComponents,
      context,
      journeyStage,
      interactions
    );
    
    // Adjust component order based on user behavior
    const orderedComponents = this.adjustComponentOrder(
      visibleComponents,
      context,
      interactions
    );
    
    // Determine optimal column layout
    const columns = this.determineColumnLayout(
      orderedComponents.length,
      context.device || 'desktop'
    );
    
    return {
      components: orderedComponents,
      emphasis,
      columns
    };
  }

  private determineLayoutEmphasis(
    stage: JourneyStage,
    context: UserContext
  ): DashboardLayout['emphasis'] {
    switch (stage) {
      case 'discovery':
        return 'onboarding';
      case 'foundation':
        return context.progress.stats?.totalTasksCompleted > 20 ? 'growth' : 'onboarding';
      case 'growth':
      case 'scale':
        return 'growth';
      case 'mastery':
        return 'optimization';
      default:
        return 'onboarding';
    }
  }

  private filterComponentsByConditions(
    components: DashboardComponent[],
    context: UserContext,
    stage: JourneyStage,
    interactions: any[]
  ): DashboardComponent[] {
    return components.filter(component => {
      if (component.visibility === 'always') return true;
      if (component.visibility === 'hidden') return false;
      
      // Check conditions for conditional components
      if (component.conditions && component.conditions.length > 0) {
        return component.conditions.every(condition => 
          this.evaluateCondition(condition, context, stage, interactions)
        );
      }
      
      return true;
    });
  }

  private evaluateCondition(
    condition: LayoutCondition,
    context: UserContext,
    stage: JourneyStage,
    interactions: any[]
  ): boolean {
    switch (condition.type) {
      case 'stage':
        if (condition.operator === 'equals') {
          return stage === condition.value;
        } else if (condition.operator === 'includes') {
          return Array.isArray(condition.value) 
            ? condition.value.includes(stage)
            : condition.value === stage;
        } else if (condition.operator === 'excludes') {
          return Array.isArray(condition.value)
            ? !condition.value.includes(stage)
            : condition.value !== stage;
        }
        break;
        
      case 'progress':
        const progressValue = condition.field 
          ? context.progress.stats?.[condition.field] || 0
          : 0;
          
        if (condition.operator === 'greater') {
          return progressValue > condition.value;
        } else if (condition.operator === 'less') {
          return progressValue < condition.value;
        } else if (condition.operator === 'equals') {
          return progressValue === condition.value;
        }
        break;
        
      case 'time':
        const daysActive = context.profile
          ? Math.floor((Date.now() - new Date(context.profile.createdAt).getTime()) / (1000 * 60 * 60 * 24))
          : 0;
          
        if (condition.operator === 'greater') {
          return daysActive > condition.value;
        } else if (condition.operator === 'less') {
          return daysActive < condition.value;
        }
        break;
        
      case 'interaction':
        const interactionCount = interactions.filter(
          i => i.interactionType === condition.value
        ).length;
        
        if (condition.operator === 'greater') {
          return interactionCount > (condition.field ? parseInt(condition.field) : 0);
        }
        break;
        
      case 'feature':
        // Check if user has used a specific feature
        const hasUsedFeature = interactions.some(
          i => i.context?.feature === condition.value
        );
        
        return condition.operator === 'equals' ? hasUsedFeature : !hasUsedFeature;
    }
    
    return false;
  }

  private adjustComponentOrder(
    components: DashboardComponent[],
    context: UserContext,
    interactions: any[]
  ): DashboardComponent[] {
    // Analyze user interaction patterns
    const interactionCounts = this.analyzeInteractionPatterns(interactions);
    
    // Adjust component priorities based on usage
    const adjustedComponents = components.map(component => {
      const interactionCount = interactionCounts[component.id] || 0;
      const usageBoost = Math.min(interactionCount * 0.5, 3); // Max boost of 3
      
      return {
        ...component,
        priority: component.priority + usageBoost
      };
    });
    
    // Sort by priority and order
    return adjustedComponents.sort((a, b) => {
      // First sort by priority (higher first)
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      // Then by defined order (lower first)
      return (a.order || 999) - (b.order || 999);
    });
  }

  private analyzeInteractionPatterns(interactions: any[]): Record<string, number> {
    const counts: Record<string, number> = {};
    
    interactions.forEach(interaction => {
      const componentId = interaction.context?.componentId || interaction.context?.target;
      if (componentId) {
        counts[componentId] = (counts[componentId] || 0) + 1;
      }
    });
    
    return counts;
  }

  private determineColumnLayout(
    componentCount: number,
    device: string
  ): 1 | 2 | 3 {
    if (device === 'mobile') return 1;
    if (device === 'tablet') return 2;
    
    // Desktop layout based on component count
    if (componentCount <= 4) return 2;
    return 3;
  }

  getComponentGridClass(component: DashboardComponent, columns: number): string {
    const spanMap = {
      small: { 1: 'col-span-1', 2: 'col-span-1', 3: 'col-span-1' },
      medium: { 1: 'col-span-1', 2: 'col-span-2', 3: 'col-span-2' },
      large: { 1: 'col-span-1', 2: 'col-span-2', 3: 'col-span-2' },
      full: { 1: 'col-span-1', 2: 'col-span-2', 3: 'col-span-3' }
    };
    
    return spanMap[component.gridSpan || 'medium'][columns];
  }
}

export const layoutOrchestrator = new LayoutOrchestrator();