import { promises as fs } from 'fs';
import path from 'path';

export interface ParsedTask {
  id: string;
  roadmapId: string;
  platform: string;
  niche: string;
  phase: number;
  week: number;
  dayRange: string;
  title: string;
  description: string;
  instructions: string[];
  timeEstimate: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'content' | 'technical' | 'community' | 'analytics' | 'monetization';
  platformSpecific: {
    tips: string[];
    bestPractices: string[];
    commonMistakes: string[];
  };
  successMetrics: {
    metric: string;
    target: number | string;
    howToMeasure: string;
  }[];
  resources: {
    type: 'template' | 'guide' | 'tool' | 'example';
    title: string;
    url?: string;
    content?: string;
  }[];
  metadata?: Record<string, any>;
}

export interface ParsedMilestone {
  id: string;
  name: string;
  description: string;
  requirement: {
    type: 'task_completion' | 'metric_achievement' | 'time_based';
    value: number | string;
  };
  reward: {
    type: 'badge' | 'feature_unlock' | 'template_access';
    value: string;
  };
  celebration: {
    type: 'modal' | 'confetti' | 'notification';
    message: string;
    sharePrompt?: string;
  };
  platform?: string;
  niche?: string;
  orderIndex: number;
}

export interface ParsedTemplate {
  category: string;
  type: string;
  title: string;
  content: any;
  variables: string[];
  platform: string;
  niche: string;
}

export interface ParsedQuickTip {
  title: string;
  content: string;
  category: string;
  platform?: string;
  niche?: string;
  difficulty: string;
  tags: string[];
  source?: string;
}

export class ContentParser {
  private researchDocsPath: string;

  constructor(researchDocsPath: string = '/mnt/c/Projects/CreatorCompass/Docs') {
    this.researchDocsPath = researchDocsPath;
  }

  async parseYouTubePlaybook(): Promise<{
    tasks: ParsedTask[];
    milestones: ParsedMilestone[];
    templates: ParsedTemplate[];
    tips: ParsedQuickTip[];
  }> {
    const content = await fs.readFile(
      path.join(this.researchDocsPath, 'YouTube Channel Playbooks.md'),
      'utf-8'
    );

    const tasks: ParsedTask[] = [];
    const milestones: ParsedMilestone[] = [];
    const templates: ParsedTemplate[] = [];
    const tips: ParsedQuickTip[] = [];

    // Parse daily tasks from the playbook
    const taskMatches = content.matchAll(/\*\s+\*\*(.+?):\*\*\s+(.+?)(?=\n\*|\n\n|\n_|$)/gs);
    
    for (const match of taskMatches) {
      const [, taskTitle, taskContent] = match;
      
      // Extract time estimates, categories, and other metadata
      const timeMatch = taskContent.match(/(\d+)\s*(?:minutes?|hours?|mins?|hrs?)/i);
      const timeEstimate = timeMatch ? 
        (timeMatch[0].includes('hour') ? parseInt(timeMatch[1]) * 60 : parseInt(timeMatch[1])) : 
        30; // Default to 30 minutes

      // Parse task into structured format
      const task: ParsedTask = {
        id: this.generateTaskId(taskTitle),
        roadmapId: 'youtube_gaming_phase1_week1', // Will be determined by context
        platform: 'youtube',
        niche: 'gaming', // Will be determined by context
        phase: 1,
        week: 1,
        dayRange: 'Day 1',
        title: taskTitle.trim(),
        description: taskContent.trim(),
        instructions: this.extractInstructions(taskContent),
        timeEstimate,
        difficulty: this.determineDifficulty(taskContent),
        category: this.determineCategory(taskTitle, taskContent),
        platformSpecific: {
          tips: this.extractTips(taskContent),
          bestPractices: this.extractBestPractices(taskContent),
          commonMistakes: this.extractCommonMistakes(taskContent)
        },
        successMetrics: this.extractMetrics(taskContent),
        resources: this.extractResources(taskContent),
        metadata: {}
      };

      tasks.push(task);
    }

    // Parse milestones
    const milestoneMatches = content.matchAll(/\*\*Milestone.*?:\*\*\s*(.+?)(?=\n\*|\n\n|$)/gs);
    let milestoneIndex = 0;
    
    for (const match of milestoneMatches) {
      const [, milestoneContent] = match;
      
      const milestone: ParsedMilestone = {
        id: `milestone_${++milestoneIndex}`,
        name: this.extractMilestoneName(milestoneContent),
        description: milestoneContent.trim(),
        requirement: this.extractRequirement(milestoneContent),
        reward: this.extractReward(milestoneContent),
        celebration: {
          type: 'modal',
          message: `Congratulations! ${milestoneContent}`,
          sharePrompt: 'Share your achievement with the community!'
        },
        platform: 'youtube',
        orderIndex: milestoneIndex
      };

      milestones.push(milestone);
    }

    // Parse templates from content ideas and structures
    const templateSections = content.match(/\*\*Content Ideas.*?\*\*([\s\S]+?)(?=\n\*\*|$)/g);
    
    if (templateSections) {
      for (const section of templateSections) {
        const ideas = section.matchAll(/\d+\.\s+\*\*(.+?):\*\*\s+(.+?)(?=\n\d+\.|\n\n|$)/gs);
        
        for (const [, ideaTitle, ideaContent] of ideas) {
          const template: ParsedTemplate = {
            category: 'video_script',
            type: this.determineTemplateType(ideaTitle),
            title: ideaTitle.trim(),
            content: {
              structure: ideaContent.trim(),
              variables: this.extractVariables(ideaContent)
            },
            variables: this.extractVariables(ideaContent),
            platform: 'youtube',
            niche: 'gaming'
          };

          templates.push(template);
        }
      }
    }

    // Parse quick tips
    const tipMatches = content.matchAll(/(?:Tip|Pro tip|Note):\s*(.+?)(?=\n|$)/gi);
    
    for (const match of tipMatches) {
      const [, tipContent] = match;
      
      const tip: ParsedQuickTip = {
        title: this.generateTipTitle(tipContent),
        content: tipContent.trim(),
        category: 'growth',
        platform: 'youtube',
        difficulty: 'beginner',
        tags: this.extractTags(tipContent),
        source: 'YouTube Channel Playbooks'
      };

      tips.push(tip);
    }

    return { tasks, milestones, templates, tips };
  }

  async parseTikTokPlaybook(): Promise<{
    tasks: ParsedTask[];
    milestones: ParsedMilestone[];
    templates: ParsedTemplate[];
    tips: ParsedQuickTip[];
  }> {
    const content = await fs.readFile(
      path.join(this.researchDocsPath, 'TikTok Content Creator Playbooks.md'),
      'utf-8'
    );

    const tasks: ParsedTask[] = [];
    const milestones: ParsedMilestone[] = [];
    const templates: ParsedTemplate[] = [];
    const tips: ParsedQuickTip[] = [];

    // TikTok-specific parsing logic
    // Similar structure to YouTube but adapted for TikTok's format

    return { tasks, milestones, templates, tips };
  }

  async parseTwitchPlaybook(): Promise<{
    tasks: ParsedTask[];
    milestones: ParsedMilestone[];
    templates: ParsedTemplate[];
    tips: ParsedQuickTip[];
  }> {
    const content = await fs.readFile(
      path.join(this.researchDocsPath, 'Twitch Streaming Playbooks.md'),
      'utf-8'
    );

    const tasks: ParsedTask[] = [];
    const milestones: ParsedMilestone[] = [];
    const templates: ParsedTemplate[] = [];
    const tips: ParsedQuickTip[] = [];

    // Twitch-specific parsing logic

    return { tasks, milestones, templates, tips };
  }

  // Helper methods
  private generateTaskId(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '_').substring(0, 50);
  }

  private extractInstructions(content: string): string[] {
    const instructions: string[] = [];
    
    // Look for numbered lists or bullet points
    const listItems = content.matchAll(/(?:\d+\.|[-*])\s+(.+?)(?=\n(?:\d+\.|[-*])|\n\n|$)/gs);
    
    for (const [, instruction] of listItems) {
      instructions.push(instruction.trim());
    }

    // If no list found, split by sentences
    if (instructions.length === 0) {
      instructions.push(...content.split(/[.!?]\s+/).filter(s => s.length > 10));
    }

    return instructions;
  }

  private determineDifficulty(content: string): 'beginner' | 'intermediate' | 'advanced' {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('advanced') || lowerContent.includes('expert')) {
      return 'advanced';
    } else if (lowerContent.includes('intermediate') || lowerContent.includes('moderate')) {
      return 'intermediate';
    }
    
    return 'beginner';
  }

  private determineCategory(title: string, content: string): ParsedTask['category'] {
    const combined = (title + ' ' + content).toLowerCase();
    
    if (combined.includes('monetiz') || combined.includes('revenue') || combined.includes('earning')) {
      return 'monetization';
    } else if (combined.includes('analytic') || combined.includes('metric') || combined.includes('data')) {
      return 'analytics';
    } else if (combined.includes('community') || combined.includes('engage') || combined.includes('audience')) {
      return 'community';
    } else if (combined.includes('technical') || combined.includes('setup') || combined.includes('equipment')) {
      return 'technical';
    }
    
    return 'content';
  }

  private extractTips(content: string): string[] {
    const tips: string[] = [];
    const tipMatches = content.matchAll(/(?:tip|advice|recommend):\s*(.+?)(?=\.|!|\n|$)/gi);
    
    for (const [, tip] of tipMatches) {
      tips.push(tip.trim());
    }
    
    return tips;
  }

  private extractBestPractices(content: string): string[] {
    const practices: string[] = [];
    const practiceMatches = content.matchAll(/(?:best practice|should|always|make sure):\s*(.+?)(?=\.|!|\n|$)/gi);
    
    for (const [, practice] of practiceMatches) {
      practices.push(practice.trim());
    }
    
    return practices;
  }

  private extractCommonMistakes(content: string): string[] {
    const mistakes: string[] = [];
    const mistakeMatches = content.matchAll(/(?:mistake|avoid|don't|never):\s*(.+?)(?=\.|!|\n|$)/gi);
    
    for (const [, mistake] of mistakeMatches) {
      mistakes.push(mistake.trim());
    }
    
    return mistakes;
  }

  private extractMetrics(content: string): ParsedTask['successMetrics'] {
    const metrics: ParsedTask['successMetrics'] = [];
    
    // Look for number-based targets
    const metricMatches = content.matchAll(/(\d+[k\w]*)\s*(subscribers?|views?|followers?|hours?|minutes?)/gi);
    
    for (const [, target, metric] of metricMatches) {
      metrics.push({
        metric: metric,
        target: target,
        howToMeasure: `Track ${metric} in your analytics dashboard`
      });
    }
    
    return metrics;
  }

  private extractResources(content: string): ParsedTask['resources'] {
    const resources: ParsedTask['resources'] = [];
    
    // Look for tool mentions
    const toolMatches = content.matchAll(/(?:use|using|with)\s+([A-Z][a-zA-Z\s]+?)(?:\s+to|\s+for|\.|\,)/g);
    
    for (const [, tool] of toolMatches) {
      if (tool.length > 2 && tool.length < 30) {
        resources.push({
          type: 'tool',
          title: tool.trim()
        });
      }
    }
    
    return resources;
  }

  private extractMilestoneName(content: string): string {
    const nameMatch = content.match(/^(.+?)(?:\.|!|:)/);
    return nameMatch ? nameMatch[1].trim() : content.substring(0, 50);
  }

  private extractRequirement(content: string): ParsedMilestone['requirement'] {
    const numberMatch = content.match(/(\d+[k\w]*)\s*(subscribers?|views?|followers?|videos?|streams?|days?)/i);
    
    if (numberMatch) {
      return {
        type: 'metric_achievement',
        value: `${numberMatch[1]} ${numberMatch[2]}`
      };
    }
    
    return {
      type: 'task_completion',
      value: '10 tasks'
    };
  }

  private extractReward(content: string): ParsedMilestone['reward'] {
    if (content.toLowerCase().includes('unlock')) {
      return {
        type: 'feature_unlock',
        value: 'Advanced templates'
      };
    }
    
    return {
      type: 'badge',
      value: 'Achievement badge'
    };
  }

  private determineTemplateType(title: string): string {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('hook') || lowerTitle.includes('intro')) return 'hook';
    if (lowerTitle.includes('outro') || lowerTitle.includes('end')) return 'outro';
    if (lowerTitle.includes('thumbnail')) return 'thumbnail';
    if (lowerTitle.includes('description')) return 'description';
    
    return 'structure';
  }

  private extractVariables(content: string): string[] {
    const variables: string[] = [];
    const varMatches = content.matchAll(/\[([^\]]+)\]/g);
    
    for (const [, variable] of varMatches) {
      variables.push(variable);
    }
    
    return variables;
  }

  private generateTipTitle(content: string): string {
    const words = content.split(' ').slice(0, 5).join(' ');
    return words.length > 30 ? words.substring(0, 30) + '...' : words;
  }

  private extractTags(content: string): string[] {
    const tags: string[] = [];
    const keywords = ['growth', 'engagement', 'algorithm', 'viral', 'trending', 'audience'];
    
    for (const keyword of keywords) {
      if (content.toLowerCase().includes(keyword)) {
        tags.push(keyword);
      }
    }
    
    return tags;
  }
}

export default ContentParser;