import { promises as fs } from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ParsedContent {
  tasks: any[];
  milestones: any[];
  templates: any[];
  tips: any[];
  resources: any[];
}

class ResearchDocumentParser {
  private docsPath = '/mnt/c/Projects/CreatorCompass/Docs';
  private platformConfigs = {
    youtube: {
      niches: ['gaming', 'education', 'lifestyle', 'tech', 'entertainment'],
      categories: ['content', 'technical', 'community', 'analytics', 'monetization']
    },
    tiktok: {
      niches: ['entertainment', 'education', 'lifestyle', 'comedy', 'dance'],
      categories: ['content', 'trends', 'engagement', 'growth', 'monetization']
    },
    twitch: {
      niches: ['gaming', 'justchatting', 'music', 'art', 'coding'],
      categories: ['streaming', 'technical', 'community', 'monetization', 'growth']
    }
  };

  async parseAllDocuments(): Promise<ParsedContent> {
    console.log('📚 Starting comprehensive document parsing...\n');
    
    const allContent: ParsedContent = {
      tasks: [],
      milestones: [],
      templates: [],
      tips: [],
      resources: []
    };

    // Parse each document
    const documents = [
      { file: 'YouTube Channel Playbooks.md', platform: 'youtube' },
      { file: 'TikTok Content Creator Playbooks.md', platform: 'tiktok' },
      { file: 'Twitch Streaming Playbooks.md', platform: 'twitch' },
      { file: 'Content Idea Generators.md', platform: 'all' },
      { file: 'Analytics and Optimization.md', platform: 'all' },
      { file: 'Engagement and Community Building.md', platform: 'all' },
      { file: 'Monetization Pathways.md', platform: 'all' },
      { file: 'Platform Algorithm Analysis.md', platform: 'all' },
      { file: 'Technical Setup Guides.md', platform: 'all' },
      { file: 'Bio and Channel Optimization.md', platform: 'all' },
      { file: 'Cross-Platform Growth Strategies.md', platform: 'all' }
    ];

    for (const doc of documents) {
      console.log(`\n📄 Parsing ${doc.file}...`);
      const content = await this.parseDocument(doc.file, doc.platform);
      
      allContent.tasks.push(...content.tasks);
      allContent.milestones.push(...content.milestones);
      allContent.templates.push(...content.templates);
      allContent.tips.push(...content.tips);
      allContent.resources.push(...content.resources);
    }

    return allContent;
  }

  private async parseDocument(filename: string, platform: string): Promise<ParsedContent> {
    const filePath = path.join(this.docsPath, filename);
    const content = await fs.readFile(filePath, 'utf-8');
    
    const result: ParsedContent = {
      tasks: [],
      milestones: [],
      templates: [],
      tips: [],
      resources: []
    };

    // Parse based on document type
    if (filename.includes('Playbook')) {
      result.tasks.push(...this.parsePlaybookTasks(content, platform));
      result.milestones.push(...this.parsePlaybookMilestones(content, platform));
    }
    
    if (filename.includes('Content Idea')) {
      result.templates.push(...this.parseContentIdeas(content, platform));
    }
    
    if (filename.includes('Analytics')) {
      result.tasks.push(...this.parseAnalyticsTasks(content, platform));
      result.tips.push(...this.parseAnalyticsTips(content, platform));
    }
    
    if (filename.includes('Engagement')) {
      result.tasks.push(...this.parseEngagementTasks(content, platform));
      result.tips.push(...this.parseEngagementTips(content, platform));
    }
    
    if (filename.includes('Monetization')) {
      result.milestones.push(...this.parseMonetizationMilestones(content, platform));
      result.resources.push(...this.parseMonetizationResources(content, platform));
    }
    
    if (filename.includes('Technical Setup')) {
      result.tasks.push(...this.parseTechnicalTasks(content, platform));
      result.resources.push(...this.parseTechnicalResources(content, platform));
    }
    
    if (filename.includes('Algorithm')) {
      result.tips.push(...this.parseAlgorithmTips(content, platform));
    }

    return result;
  }

  private parsePlaybookTasks(content: string, platform: string): any[] {
    const tasks: any[] = [];
    const sections = content.split(/^#+\s+/m);
    
    let phaseNum = 1;
    let weekNum = 1;
    let taskId = 0;

    for (const section of sections) {
      // Extract phase information
      if (section.includes('Phase') || section.includes('Week')) {
        const phaseMatch = section.match(/Phase\s+(\d+)/i);
        const weekMatch = section.match(/Week\s+(\d+)/i);
        
        if (phaseMatch) phaseNum = parseInt(phaseMatch[1]);
        if (weekMatch) weekNum = parseInt(weekMatch[1]);
      }

      // Extract daily tasks
      const taskMatches = section.matchAll(/(?:Day\s+\d+[-–]?\d*|Daily\s+Tasks?)[\s:]*\n([\s\S]+?)(?=\n(?:Day\s+\d+|Daily|Week|Phase|##|$))/gi);
      
      for (const match of taskMatches) {
        const [fullMatch, taskContent] = match;
        const dayMatch = fullMatch.match(/Day\s+(\d+)(?:[-–](\d+))?/i);
        const dayRange = dayMatch ? 
          (dayMatch[2] ? `Days ${dayMatch[1]}-${dayMatch[2]}` : `Day ${dayMatch[1]}`) : 
          'Daily';

        // Parse individual tasks from content
        const taskItems = this.extractTaskItems(taskContent);
        
        for (const item of taskItems) {
          const task = {
            id: `${platform}_task_${++taskId}`,
            roadmapId: `${platform}_phase${phaseNum}_week${weekNum}`,
            platform: platform === 'all' ? 'youtube' : platform, // Default to youtube for cross-platform
            niche: 'general', // Will be enhanced per niche
            phase: phaseNum,
            week: weekNum,
            dayRange,
            title: item.title,
            description: item.description,
            instructions: item.instructions,
            timeEstimate: item.timeEstimate,
            difficulty: this.determineDifficulty(phaseNum, weekNum),
            category: item.category,
            platformSpecific: {
              tips: this.extractPlatformTips(taskContent, platform),
              bestPractices: this.extractBestPractices(taskContent),
              commonMistakes: this.extractCommonMistakes(taskContent)
            },
            successMetrics: this.extractSuccessMetrics(taskContent),
            resources: this.extractTaskResources(taskContent),
            orderIndex: taskId,
            metadata: {
              source: 'research_docs',
              parsed_from: section.substring(0, 100)
            }
          };

          // Create variations for different niches if platform-specific
          if (platform !== 'all') {
            const niches = this.platformConfigs[platform as keyof typeof this.platformConfigs]?.niches || ['general'];
            for (const niche of niches.slice(0, 3)) { // Limit to 3 niches per task
              tasks.push({
                ...task,
                id: `${platform}_${niche}_task_${taskId}`,
                niche,
                title: this.adaptTitleForNiche(task.title, niche),
                description: this.adaptDescriptionForNiche(task.description, niche)
              });
            }
          } else {
            tasks.push(task);
          }
        }
      }
    }

    return tasks;
  }

  private extractTaskItems(content: string): any[] {
    const items: any[] = [];
    const lines = content.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      // Skip headers and empty lines
      if (line.startsWith('#') || !line.trim()) continue;
      
      // Extract task from bullet points or numbered lists
      const taskMatch = line.match(/^[-*•]\s+(.+)|^\d+\.\s+(.+)/);
      if (taskMatch) {
        const taskText = taskMatch[1] || taskMatch[2];
        const timeMatch = taskText.match(/\((\d+)\s*(hours?|hrs?|minutes?|mins?)\)/i);
        const timeEstimate = this.parseTimeEstimate(timeMatch?.[0] || '1 hour');
        
        items.push({
          title: this.extractTaskTitle(taskText),
          description: this.expandTaskDescription(taskText),
          instructions: this.generateInstructions(taskText),
          timeEstimate,
          category: this.categorizeTask(taskText)
        });
      }
    }

    // If no specific tasks found, create a general task from the content
    if (items.length === 0 && content.trim()) {
      items.push({
        title: this.generateTaskTitle(content),
        description: content.trim(),
        instructions: this.generateInstructions(content),
        timeEstimate: 60,
        category: 'content'
      });
    }

    return items;
  }

  private parsePlaybookMilestones(content: string, platform: string): any[] {
    const milestones: any[] = [];
    let milestoneId = 0;

    // Extract milestones from various patterns
    const patterns = [
      /Goals?:\s*\n([\s\S]+?)(?=\n(?:Week|Phase|##|$))/gi,
      /Milestones?:\s*\n([\s\S]+?)(?=\n(?:Week|Phase|##|$))/gi,
      /By the end of (?:this )?(week|month|phase)[^:]*:\s*\n([\s\S]+?)(?=\n(?:Week|Phase|##|$))/gi,
      /Success Metrics:\s*\n([\s\S]+?)(?=\n(?:Week|Phase|##|$))/gi
    ];

    for (const pattern of patterns) {
      const matches = content.matchAll(pattern);
      
      for (const match of matches) {
        const goalsContent = match[match.length - 1];
        const goalItems = goalsContent.matchAll(/[-*•]\s+(.+)|^\d+\.\s+(.+)/gm);
        
        for (const goalMatch of goalItems) {
          const goalText = goalMatch[1] || goalMatch[2];
          if (!goalText || goalText.length < 10) continue;
          
          const milestone = {
            id: `${platform}_milestone_${++milestoneId}`,
            name: this.generateMilestoneName(goalText),
            description: goalText.trim(),
            requirement: this.extractMilestoneRequirement(goalText),
            reward: this.generateMilestoneReward(goalText),
            celebration: {
              type: this.determineCelebrationType(goalText),
              message: this.generateCelebrationMessage(goalText),
              sharePrompt: 'Share your achievement with the community!'
            },
            platform: platform === 'all' ? null : platform,
            orderIndex: milestoneId
          };

          milestones.push(milestone);
        }
      }
    }

    return milestones;
  }

  private parseContentIdeas(content: string, platform: string): any[] {
    const templates: any[] = [];
    let templateId = 0;

    // Extract content ideas and formats
    const sections = content.split(/^###?\s+/m);
    
    for (const section of sections) {
      const categoryMatch = section.match(/^(.+?)\n/);
      const category = categoryMatch ? this.normalizeCategory(categoryMatch[1]) : 'video_script';
      
      // Extract individual content ideas
      const ideaMatches = section.matchAll(/^\d+\.\s*\*?\*?(.+?)\*?\*?:?\s*(.+?)(?=\n\d+\.|$)/gm);
      
      for (const match of ideaMatches) {
        const [, title, description] = match;
        
        const template = {
          id: `template_${++templateId}`,
          category,
          type: this.determineTemplateType(title),
          title: title.trim(),
          content: {
            structure: description.trim(),
            sections: this.extractTemplateSections(description),
            examples: this.extractExamples(description)
          },
          variables: this.extractTemplateVariables(description),
          platform: platform === 'all' ? 'youtube' : platform,
          niche: 'general',
          isPublic: true,
          uses: 0,
          rating: null
        };

        templates.push(template);
      }

      // Extract hook templates
      if (section.toLowerCase().includes('hook')) {
        const hooks = this.extractHookTemplates(section);
        templates.push(...hooks.map(hook => ({
          id: `template_${++templateId}`,
          category: 'video_script',
          type: 'hook',
          title: hook.title,
          content: hook.content,
          variables: hook.variables,
          platform: platform === 'all' ? 'youtube' : platform,
          niche: 'general',
          isPublic: true,
          uses: 0,
          rating: null
        })));
      }
    }

    return templates;
  }

  private parseAnalyticsTasks(content: string, platform: string): any[] {
    const tasks: any[] = [];
    let taskId = 0;

    // Extract analytics-related tasks
    const taskSections = content.matchAll(/(?:Daily|Weekly|Monthly)\s+Analytics\s+Tasks?:?\s*\n([\s\S]+?)(?=\n(?:Daily|Weekly|Monthly|##|$))/gi);
    
    for (const match of taskSections) {
      const [fullMatch, taskContent] = match;
      const frequency = fullMatch.match(/(Daily|Weekly|Monthly)/i)?.[1] || 'Weekly';
      
      const taskItems = taskContent.matchAll(/[-*•]\s+(.+)|^\d+\.\s+(.+)/gm);
      
      for (const item of taskItems) {
        const taskText = item[1] || item[2];
        
        const task = {
          id: `analytics_task_${++taskId}`,
          roadmapId: 'analytics_optimization',
          platform: platform === 'all' ? 'youtube' : platform,
          niche: 'general',
          phase: 2, // Analytics typically in phase 2
          week: 1,
          dayRange: frequency,
          title: `${frequency} Analytics: ${this.extractTaskTitle(taskText)}`,
          description: taskText.trim(),
          instructions: this.generateAnalyticsInstructions(taskText),
          timeEstimate: frequency === 'Daily' ? 15 : frequency === 'Weekly' ? 60 : 120,
          difficulty: 'intermediate',
          category: 'analytics',
          platformSpecific: {
            tips: ['Use platform analytics dashboard', 'Export data for tracking'],
            bestPractices: ['Track consistently', 'Compare week-over-week'],
            commonMistakes: ['Ignoring analytics', 'Not acting on insights']
          },
          successMetrics: [
            { metric: 'analytics_review', target: 'completed', howToMeasure: 'Check task completion' }
          ],
          resources: [
            { type: 'tool', title: `${platform} Analytics` },
            { type: 'guide', title: 'Analytics Best Practices' }
          ],
          orderIndex: taskId,
          metadata: { frequency }
        };

        tasks.push(task);
      }
    }

    return tasks;
  }

  private parseAnalyticsTips(content: string, platform: string): any[] {
    const tips: any[] = [];
    let tipId = 0;

    // Extract tips and insights
    const tipPatterns = [
      /(?:Pro )?Tips?:?\s*(.+?)(?=\n|$)/gi,
      /(?:Key )?Insights?:?\s*(.+?)(?=\n|$)/gi,
      /Important:?\s*(.+?)(?=\n|$)/gi,
      /Note:?\s*(.+?)(?=\n|$)/gi
    ];

    for (const pattern of tipPatterns) {
      const matches = content.matchAll(pattern);
      
      for (const match of matches) {
        const tipText = match[1].trim();
        if (tipText.length < 20) continue;
        
        const tip = {
          id: `tip_${++tipId}`,
          title: this.generateTipTitle(tipText),
          content: tipText,
          category: 'analytics',
          platform: platform === 'all' ? null : platform,
          niche: null,
          difficulty: 'intermediate',
          tags: this.extractTipTags(tipText),
          source: 'Analytics and Optimization Guide',
          isActive: true
        };

        tips.push(tip);
      }
    }

    return tips;
  }

  private parseEngagementTasks(content: string, platform: string): any[] {
    const tasks: any[] = [];
    let taskId = 0;

    // Extract community and engagement tasks
    const engagementSections = content.matchAll(/(?:Community|Engagement|Interaction)\s+(?:Tasks?|Activities|Strategies):?\s*\n([\s\S]+?)(?=\n(?:Community|Engagement|##|$))/gi);
    
    for (const match of engagementSections) {
      const [, taskContent] = match;
      const taskItems = this.extractTaskItems(taskContent);
      
      for (const item of taskItems) {
        const task = {
          id: `engagement_task_${++taskId}`,
          roadmapId: 'community_building',
          platform: platform === 'all' ? 'youtube' : platform,
          niche: 'general',
          phase: 1,
          week: 2, // Engagement starts early
          dayRange: 'Daily',
          title: `Engagement: ${item.title}`,
          description: item.description,
          instructions: item.instructions,
          timeEstimate: 30,
          difficulty: 'beginner',
          category: 'community',
          platformSpecific: {
            tips: this.extractEngagementTips(taskContent),
            bestPractices: ['Be authentic', 'Respond promptly', 'Add value'],
            commonMistakes: ['Generic responses', 'Ignoring negative feedback']
          },
          successMetrics: [
            { metric: 'comments_replied', target: '10', howToMeasure: 'Track daily responses' },
            { metric: 'engagement_rate', target: '5%', howToMeasure: 'Calculate interactions/views' }
          ],
          resources: [],
          orderIndex: taskId,
          metadata: { recurring: true }
        };

        tasks.push(task);
      }
    }

    return tasks;
  }

  private parseEngagementTips(content: string, platform: string): any[] {
    const tips: any[] = [];
    let tipId = 0;

    // Extract engagement strategies and tips
    const strategyMatches = content.matchAll(/Strateg(?:y|ies):?\s*\n([\s\S]+?)(?=\n(?:Strategy|##|$))/gi);
    
    for (const match of strategyMatches) {
      const [, strategyContent] = match;
      const items = strategyContent.matchAll(/[-*•]\s+(.+)|^\d+\.\s+(.+)/gm);
      
      for (const item of items) {
        const tipText = item[1] || item[2];
        if (!tipText || tipText.length < 20) continue;
        
        const tip = {
          id: `engagement_tip_${++tipId}`,
          title: this.generateTipTitle(tipText),
          content: tipText.trim(),
          category: 'engagement',
          platform: platform === 'all' ? null : platform,
          niche: null,
          difficulty: 'beginner',
          tags: ['community', 'engagement', 'growth'],
          source: 'Engagement and Community Building Guide',
          isActive: true
        };

        tips.push(tip);
      }
    }

    return tips;
  }

  private parseMonetizationMilestones(content: string, platform: string): any[] {
    const milestones: any[] = [];
    let milestoneId = 0;

    // Extract monetization milestones
    const monetizationGoals = content.matchAll(/(?:Revenue|Monetization|Income)\s+(?:Goals?|Milestones?|Targets?):?\s*\n([\s\S]+?)(?=\n(?:Revenue|Monetization|##|$))/gi);
    
    for (const match of monetizationGoals) {
      const [, goalsContent] = match;
      const items = goalsContent.matchAll(/[-*•]\s+(.+)|^\d+\.\s+(.+)/gm);
      
      for (const item of items) {
        const goalText = item[1] || item[2];
        if (!goalText) continue;
        
        const milestone = {
          id: `monetization_milestone_${++milestoneId}`,
          name: this.generateMilestoneName(goalText),
          description: `Monetization Goal: ${goalText.trim()}`,
          requirement: this.extractMonetizationRequirement(goalText),
          reward: {
            type: 'feature_unlock',
            value: 'Advanced Monetization Strategies'
          },
          celebration: {
            type: 'modal',
            message: `💰 Monetization milestone achieved! ${goalText}`,
            sharePrompt: 'Share your revenue milestone!'
          },
          platform: platform === 'all' ? null : platform,
          orderIndex: milestoneId + 100 // Monetization milestones come later
        };

        milestones.push(milestone);
      }
    }

    return milestones;
  }

  private parseMonetizationResources(content: string, platform: string): any[] {
    const resources: any[] = [];
    
    // Extract monetization methods and tools
    const methodSections = content.matchAll(/(?:Monetization |Revenue |Income )?(?:Methods?|Streams?|Sources?):?\s*\n([\s\S]+?)(?=\n(?:Method|Revenue|##|$))/gi);
    
    for (const match of methodSections) {
      const [, methodContent] = match;
      const methods = methodContent.matchAll(/[-*•]\s+\*?\*?(.+?)\*?\*?:?\s*(.+?)(?=\n[-*•]|$)/gm);
      
      for (const method of methods) {
        const [, methodName, description] = method;
        
        resources.push({
          type: 'guide',
          title: `Monetization: ${methodName.trim()}`,
          content: description.trim(),
          platform: platform === 'all' ? null : platform
        });
      }
    }

    return resources;
  }

  private parseTechnicalTasks(content: string, platform: string): any[] {
    const tasks: any[] = [];
    let taskId = 0;

    // Extract technical setup tasks
    const setupSections = content.matchAll(/(?:Setup|Technical|Equipment|Software)\s+(?:Tasks?|Requirements?|Guide):?\s*\n([\s\S]+?)(?=\n(?:Setup|Technical|##|$))/gi);
    
    for (const match of setupSections) {
      const [fullMatch, setupContent] = match;
      const setupType = fullMatch.match(/(Setup|Technical|Equipment|Software)/i)?.[1] || 'Technical';
      
      const items = this.extractTaskItems(setupContent);
      
      for (const item of items) {
        const task = {
          id: `technical_task_${++taskId}`,
          roadmapId: 'technical_setup',
          platform: platform === 'all' ? 'youtube' : platform,
          niche: 'general',
          phase: 1,
          week: 1,
          dayRange: 'Day 1-2',
          title: `${setupType} Setup: ${item.title}`,
          description: item.description,
          instructions: item.instructions,
          timeEstimate: 120,
          difficulty: 'intermediate',
          category: 'technical',
          platformSpecific: {
            tips: ['Research before buying', 'Start with basics', 'Upgrade gradually'],
            bestPractices: ['Test everything', 'Create backups', 'Document settings'],
            commonMistakes: ['Overspending initially', 'Ignoring audio quality']
          },
          successMetrics: [
            { metric: 'setup_complete', target: 'yes', howToMeasure: 'All equipment working' }
          ],
          resources: this.extractTechnicalResources(setupContent),
          orderIndex: taskId,
          metadata: { setupType }
        };

        tasks.push(task);
      }
    }

    return tasks;
  }

  private parseTechnicalResources(content: string, platform: string): any[] {
    const resources: any[] = [];
    
    // Extract equipment recommendations
    const equipmentMatches = content.matchAll(/(?:Recommended |Essential |Basic )?Equipment:?\s*\n([\s\S]+?)(?=\n(?:Equipment|Software|##|$))/gi);
    
    for (const match of equipmentMatches) {
      const [, equipmentContent] = match;
      const items = equipmentContent.matchAll(/[-*•]\s+(.+?)(?:\s*[-–]\s*(.+?))?(?=\n|$)/gm);
      
      for (const item of items) {
        const [, equipment, description] = item;
        
        resources.push({
          type: 'tool',
          title: equipment.trim(),
          content: description?.trim() || '',
          platform: platform === 'all' ? null : platform
        });
      }
    }

    // Extract software recommendations
    const softwareMatches = content.matchAll(/(?:Recommended |Essential |Free )?Software:?\s*\n([\s\S]+?)(?=\n(?:Equipment|Software|##|$))/gi);
    
    for (const match of softwareMatches) {
      const [, softwareContent] = match;
      const items = softwareContent.matchAll(/[-*•]\s+(.+?)(?:\s*[-–]\s*(.+?))?(?=\n|$)/gm);
      
      for (const item of items) {
        const [, software, description] = item;
        
        resources.push({
          type: 'tool',
          title: software.trim(),
          content: description?.trim() || '',
          platform: platform === 'all' ? null : platform
        });
      }
    }

    return resources;
  }

  private parseAlgorithmTips(content: string, platform: string): any[] {
    const tips: any[] = [];
    let tipId = 0;

    // Extract algorithm insights
    const algorithmSections = content.matchAll(/(?:Algorithm |Ranking |Discovery )?(?:Factors?|Signals?|Tips?):?\s*\n([\s\S]+?)(?=\n(?:Algorithm|Ranking|##|$))/gi);
    
    for (const match of algorithmSections) {
      const [, algorithmContent] = match;
      const items = algorithmContent.matchAll(/[-*•]\s+(.+)|^\d+\.\s+(.+)/gm);
      
      for (const item of items) {
        const tipText = item[1] || item[2];
        if (!tipText || tipText.length < 20) continue;
        
        const tip = {
          id: `algorithm_tip_${++tipId}`,
          title: `Algorithm Insight: ${this.generateTipTitle(tipText)}`,
          content: tipText.trim(),
          category: 'growth',
          platform: platform === 'all' ? null : platform,
          niche: null,
          difficulty: 'advanced',
          tags: ['algorithm', 'discovery', 'optimization'],
          source: 'Platform Algorithm Analysis',
          isActive: true
        };

        tips.push(tip);
      }
    }

    return tips;
  }

  // Helper methods
  private extractTaskTitle(text: string): string {
    // Remove time estimates and clean up
    const cleaned = text.replace(/\([\d\s]+(hours?|hrs?|minutes?|mins?)\)/gi, '').trim();
    
    // Take first sentence or up to 60 characters
    const firstSentence = cleaned.split(/[.!?]/)[0];
    return firstSentence.length > 60 ? firstSentence.substring(0, 60) + '...' : firstSentence;
  }

  private expandTaskDescription(text: string): string {
    // Add context and expand abbreviated descriptions
    const expanded = text
      .replace(/^Upload/, 'Upload your content to the platform')
      .replace(/^Create/, 'Create and prepare')
      .replace(/^Post/, 'Post and share')
      .replace(/^Engage/, 'Engage with your audience by');
    
    return expanded;
  }

  private generateInstructions(text: string): string[] {
    const instructions: string[] = [];
    
    // Generate step-by-step instructions based on task
    if (text.toLowerCase().includes('upload')) {
      instructions.push(
        'Prepare your content file in the correct format',
        'Write an engaging title and description',
        'Add relevant tags and categories',
        'Choose an eye-catching thumbnail',
        'Schedule or publish immediately'
      );
    } else if (text.toLowerCase().includes('engage')) {
      instructions.push(
        'Check your notifications and comments',
        'Respond to comments thoughtfully',
        'Ask questions to encourage discussion',
        'Thank viewers for their support',
        'Pin important comments'
      );
    } else if (text.toLowerCase().includes('analyze')) {
      instructions.push(
        'Open your analytics dashboard',
        'Review key metrics for the time period',
        'Identify trends and patterns',
        'Note areas for improvement',
        'Create action items based on insights'
      );
    } else {
      // Generic instructions
      instructions.push(
        'Review the task requirements',
        'Gather necessary resources',
        'Complete the main task',
        'Review and refine your work',
        'Track completion and results'
      );
    }
    
    return instructions;
  }

  private parseTimeEstimate(timeStr: string): number {
    if (!timeStr) return 60; // Default 1 hour
    
    const match = timeStr.match(/(\d+)\s*(hours?|hrs?|minutes?|mins?)/i);
    if (!match) return 60;
    
    const [, amount, unit] = match;
    const num = parseInt(amount);
    
    if (unit.toLowerCase().includes('hour')) {
      return num * 60;
    }
    
    return num;
  }

  private determineDifficulty(phase: number, week: number): 'beginner' | 'intermediate' | 'advanced' {
    if (phase === 1 && week <= 2) return 'beginner';
    if (phase >= 3 || (phase === 2 && week >= 3)) return 'advanced';
    return 'intermediate';
  }

  private categorizeTask(text: string): string {
    const lower = text.toLowerCase();
    
    if (lower.includes('upload') || lower.includes('create') || lower.includes('post')) {
      return 'content';
    } else if (lower.includes('setup') || lower.includes('configure') || lower.includes('install')) {
      return 'technical';
    } else if (lower.includes('engage') || lower.includes('respond') || lower.includes('community')) {
      return 'community';
    } else if (lower.includes('analyze') || lower.includes('metric') || lower.includes('data')) {
      return 'analytics';
    } else if (lower.includes('monetiz') || lower.includes('revenue') || lower.includes('sponsor')) {
      return 'monetization';
    }
    
    return 'content';
  }

  private extractPlatformTips(content: string, platform: string): string[] {
    const tips: string[] = [];
    
    // Platform-specific tips
    switch (platform) {
      case 'youtube':
        tips.push(
          'Upload in 1080p or higher',
          'Use end screens and cards',
          'Optimize for suggested videos'
        );
        break;
      case 'tiktok':
        tips.push(
          'Use trending sounds',
          'Keep videos under 60 seconds',
          'Post during peak hours'
        );
        break;
      case 'twitch':
        tips.push(
          'Stream consistently',
          'Interact with chat',
          'Use quality webcam and mic'
        );
        break;
    }
    
    // Extract tips from content
    const tipMatches = content.matchAll(/(?:tip|advice|recommend):\s*(.+?)(?=\.|!|\n|$)/gi);
    for (const [, tip] of tipMatches) {
      tips.push(tip.trim());
    }
    
    return tips.slice(0, 5); // Limit to 5 tips
  }

  private extractBestPractices(content: string): string[] {
    const practices: string[] = [
      'Be consistent with your schedule',
      'Engage authentically with your audience',
      'Focus on quality over quantity',
      'Track and analyze your performance',
      'Continuously improve based on feedback'
    ];
    
    // Extract from content
    const practiceMatches = content.matchAll(/(?:best practice|should|always):\s*(.+?)(?=\.|!|\n|$)/gi);
    for (const [, practice] of practiceMatches) {
      practices.push(practice.trim());
    }
    
    return practices.slice(0, 5);
  }

  private extractCommonMistakes(content: string): string[] {
    const mistakes: string[] = [
      'Inconsistent posting schedule',
      'Ignoring audience feedback',
      'Poor audio/video quality',
      'Not optimizing titles and descriptions',
      'Giving up too early'
    ];
    
    // Extract from content
    const mistakeMatches = content.matchAll(/(?:mistake|avoid|don't):\s*(.+?)(?=\.|!|\n|$)/gi);
    for (const [, mistake] of mistakeMatches) {
      mistakes.push(mistake.trim());
    }
    
    return mistakes.slice(0, 5);
  }

  private extractSuccessMetrics(content: string): any[] {
    const metrics: any[] = [];
    
    // Look for specific metrics in content
    const metricPatterns = [
      { regex: /(\d+[kKmM]?)\s*(subscribers?|followers?)/gi, type: 'subscribers' },
      { regex: /(\d+[kKmM]?)\s*(views?)/gi, type: 'views' },
      { regex: /(\d+)%?\s*(engagement|ctr|click)/gi, type: 'engagement_rate' },
      { regex: /(\d+)\s*(hours?|minutes?)\s*(watch|stream)/gi, type: 'watch_time' }
    ];
    
    for (const pattern of metricPatterns) {
      const matches = content.matchAll(pattern.regex);
      for (const match of matches) {
        metrics.push({
          metric: pattern.type,
          target: match[1],
          howToMeasure: `Track ${pattern.type} in analytics`
        });
      }
    }
    
    // Add default metrics if none found
    if (metrics.length === 0) {
      metrics.push({
        metric: 'completion',
        target: '100%',
        howToMeasure: 'Mark task as complete'
      });
    }
    
    return metrics;
  }

  private extractTaskResources(content: string): any[] {
    const resources: any[] = [];
    
    // Extract mentioned tools and resources
    const toolMatches = content.matchAll(/(?:use|using|with)\s+([A-Z][a-zA-Z\s]+?)(?:\s+to|\s+for|\.|\,)/g);
    for (const [, tool] of toolMatches) {
      if (tool.length > 2 && tool.length < 30) {
        resources.push({
          type: 'tool',
          title: tool.trim()
        });
      }
    }
    
    // Add default resources based on category
    if (content.toLowerCase().includes('template')) {
      resources.push({
        type: 'template',
        title: 'Content Template'
      });
    }
    
    if (content.toLowerCase().includes('guide')) {
      resources.push({
        type: 'guide',
        title: 'Best Practices Guide'
      });
    }
    
    return resources.slice(0, 5);
  }

  private adaptTitleForNiche(title: string, niche: string): string {
    // Add niche-specific context to titles
    const nicheContext: Record<string, string> = {
      gaming: 'Gaming: ',
      education: 'Educational: ',
      lifestyle: 'Lifestyle: ',
      tech: 'Tech: ',
      entertainment: 'Entertainment: ',
      comedy: 'Comedy: ',
      dance: 'Dance: ',
      music: 'Music: ',
      art: 'Art: ',
      coding: 'Coding: '
    };
    
    const prefix = nicheContext[niche] || '';
    return prefix + title;
  }

  private adaptDescriptionForNiche(description: string, niche: string): string {
    // Add niche-specific examples or context
    const nicheExamples: Record<string, string> = {
      gaming: ' (e.g., gameplay videos, tutorials, reviews)',
      education: ' (e.g., lessons, explanations, demonstrations)',
      lifestyle: ' (e.g., vlogs, routines, tips)',
      tech: ' (e.g., reviews, tutorials, news)',
      entertainment: ' (e.g., sketches, reactions, challenges)'
    };
    
    const example = nicheExamples[niche] || '';
    return description + example;
  }

  private generateTaskTitle(content: string): string {
    const firstLine = content.split('\n')[0];
    const cleaned = firstLine.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '');
    return cleaned.length > 60 ? cleaned.substring(0, 60) + '...' : cleaned;
  }

  private generateMilestoneName(text: string): string {
    // Extract key achievement from text
    const match = text.match(/(\d+[kKmM]?\s*(?:subscribers?|followers?|views?|hours?))/i);
    if (match) {
      return `Reach ${match[1]}`;
    }
    
    // Take first meaningful part
    const cleaned = text.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '');
    return cleaned.length > 50 ? cleaned.substring(0, 50) + '...' : cleaned;
  }

  private extractMilestoneRequirement(text: string): any {
    // Look for specific requirements
    const patterns = [
      { regex: /(\d+[kKmM]?)\s*(subscribers?|followers?)/i, type: 'metric_achievement' },
      { regex: /(\d+[kKmM]?)\s*(views?)/i, type: 'metric_achievement' },
      { regex: /(\d+)\s*(videos?|posts?|streams?)/i, type: 'task_completion' },
      { regex: /(\d+)\s*(days?|weeks?|months?)/i, type: 'time_based' }
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern.regex);
      if (match) {
        return {
          type: pattern.type,
          value: `${match[1]} ${match[2]}`
        };
      }
    }
    
    return {
      type: 'task_completion',
      value: '10'
    };
  }

  private generateMilestoneReward(text: string): any {
    // Determine reward based on milestone type
    if (text.toLowerCase().includes('monetiz') || text.toLowerCase().includes('revenue')) {
      return {
        type: 'feature_unlock',
        value: 'Monetization Features'
      };
    } else if (text.toLowerCase().includes('advanced') || text.toLowerCase().includes('pro')) {
      return {
        type: 'feature_unlock',
        value: 'Advanced Features'
      };
    } else {
      return {
        type: 'badge',
        value: 'Achievement Badge'
      };
    }
  }

  private determineCelebrationType(text: string): 'modal' | 'confetti' | 'notification' {
    // Major milestones get confetti
    if (text.match(/\d{3,}/)) { // 3+ digit numbers
      return 'confetti';
    } else if (text.toLowerCase().includes('first') || text.toLowerCase().includes('complete')) {
      return 'modal';
    }
    
    return 'notification';
  }

  private generateCelebrationMessage(text: string): string {
    return `🎉 Amazing achievement! ${text}`;
  }

  private normalizeCategory(category: string): string {
    const lower = category.toLowerCase();
    
    if (lower.includes('script') || lower.includes('video')) return 'video_script';
    if (lower.includes('thumbnail')) return 'thumbnail';
    if (lower.includes('description') || lower.includes('bio')) return 'description';
    if (lower.includes('social')) return 'social_media';
    if (lower.includes('channel') || lower.includes('profile')) return 'channel_assets';
    
    return 'video_script';
  }

  private determineTemplateType(title: string): string {
    const lower = title.toLowerCase();
    
    if (lower.includes('hook') || lower.includes('intro')) return 'hook';
    if (lower.includes('outro') || lower.includes('end')) return 'outro';
    if (lower.includes('structure') || lower.includes('format')) return 'structure';
    if (lower.includes('cta') || lower.includes('call')) return 'call_to_action';
    
    return 'general';
  }

  private extractTemplateSections(description: string): string[] {
    const sections: string[] = [];
    
    // Look for numbered or bulleted lists
    const sectionMatches = description.matchAll(/(?:\d+\.|[-*•])\s+(.+?)(?=\n(?:\d+\.|[-*•])|$)/gs);
    
    for (const match of sectionMatches) {
      sections.push(match[1].trim());
    }
    
    return sections;
  }

  private extractExamples(description: string): string[] {
    const examples: string[] = [];
    
    // Look for example patterns
    const exampleMatches = description.matchAll(/(?:e\.g\.|example|such as|like)\s*:?\s*(.+?)(?=\.|,|;|$)/gi);
    
    for (const match of exampleMatches) {
      examples.push(match[1].trim());
    }
    
    return examples;
  }

  private extractTemplateVariables(content: string): string[] {
    const variables: string[] = [];
    
    // Look for placeholders in various formats
    const patterns = [
      /\[([^\]]+)\]/g,              // [variable]
      /\{([^}]+)\}/g,               // {variable}
      /<([^>]+)>/g,                 // <variable>
      /\b(?:your|insert|add)\s+(\w+)/gi  // "your channel", "insert name"
    ];
    
    for (const pattern of patterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const variable = match[1].toLowerCase().replace(/\s+/g, '_');
        if (variable.length > 2 && variable.length < 30 && !variables.includes(variable)) {
          variables.push(variable);
        }
      }
    }
    
    return variables;
  }

  private extractHookTemplates(content: string): any[] {
    const hooks: any[] = [];
    
    // Extract hook examples
    const hookMatches = content.matchAll(/(?:"([^"]+)"|'([^']+)'|"([^"]+)")/g);
    
    for (const match of hookMatches) {
      const hook = match[1] || match[2] || match[3];
      if (hook.length > 10 && hook.length < 200) {
        hooks.push({
          title: `Hook: ${hook.substring(0, 30)}...`,
          content: {
            template: hook,
            usage: 'Use in the first 5 seconds of your video'
          },
          variables: this.extractTemplateVariables(hook)
        });
      }
    }
    
    return hooks;
  }

  private generateAnalyticsInstructions(text: string): string[] {
    return [
      'Open your platform analytics dashboard',
      'Navigate to the relevant metrics section',
      text.trim(),
      'Document your findings',
      'Create action items based on insights',
      'Schedule follow-up review'
    ];
  }

  private extractEngagementTips(content: string): string[] {
    return [
      'Respond within 24 hours',
      'Use personalized responses',
      'Ask follow-up questions',
      'Show appreciation for feedback',
      'Create community discussions'
    ];
  }

  private extractMonetizationRequirement(text: string): any {
    // Look for revenue targets
    const revenueMatch = text.match(/\$?(\d+[kKmM]?)/);
    if (revenueMatch) {
      return {
        type: 'metric_achievement',
        value: `$${revenueMatch[1]} revenue`
      };
    }
    
    // Look for platform-specific requirements
    if (text.toLowerCase().includes('partner') || text.toLowerCase().includes('monetiz')) {
      return {
        type: 'metric_achievement',
        value: 'Platform monetization enabled'
      };
    }
    
    return {
      type: 'time_based',
      value: '90 days'
    };
  }

  private extractTechnicalResources(content: string): any[] {
    const resources: any[] = [];
    
    // Common technical resources
    const commonTools = [
      'OBS Studio',
      'Audacity',
      'Canva',
      'Adobe Premiere',
      'DaVinci Resolve',
      'StreamLabs'
    ];
    
    for (const tool of commonTools) {
      if (content.toLowerCase().includes(tool.toLowerCase())) {
        resources.push({
          type: 'tool',
          title: tool
        });
      }
    }
    
    return resources;
  }

  private generateTipTitle(text: string): string {
    // Take first few words or up to punctuation
    const words = text.split(/\s+/).slice(0, 5).join(' ');
    const upToPunctuation = text.split(/[.!?]/)[0];
    
    const title = upToPunctuation.length < words.length ? upToPunctuation : words;
    return title.length > 50 ? title.substring(0, 50) + '...' : title;
  }

  private extractTipTags(text: string): string[] {
    const tags: string[] = [];
    const keywords = [
      'algorithm', 'growth', 'engagement', 'viral', 'trending',
      'audience', 'content', 'optimization', 'analytics', 'monetization'
    ];
    
    const lower = text.toLowerCase();
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        tags.push(keyword);
      }
    }
    
    return tags.slice(0, 5);
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting comprehensive Phase 3 content parsing and seeding...\n');

  try {
    const parser = new ResearchDocumentParser();
    const content = await parser.parseAllDocuments();

    console.log('\n📊 Parsing Summary:');
    console.log(`- Tasks: ${content.tasks.length}`);
    console.log(`- Milestones: ${content.milestones.length}`);
    console.log(`- Templates: ${content.templates.length}`);
    console.log(`- Tips: ${content.tips.length}`);
    console.log(`- Resources: ${content.resources.length}`);

    console.log('\n💾 Saving to database...');

    // Clear existing data
    await prisma.contentEngagement.deleteMany();
    await prisma.templateRating.deleteMany();
    await prisma.generatedTemplate.deleteMany();
    await prisma.contentRecommendation.deleteMany();
    await prisma.milestoneAchievement.deleteMany();
    await prisma.milestone.deleteMany();
    await prisma.taskCompletion.deleteMany();
    await prisma.dailyTask.deleteMany();
    await prisma.quickTip.deleteMany();

    // Insert tasks
    console.log('\n📝 Creating tasks...');
    for (const task of content.tasks) {
      await prisma.dailyTask.create({ data: task });
    }

    // Insert milestones
    console.log('🏆 Creating milestones...');
    for (const milestone of content.milestones) {
      await prisma.milestone.create({ data: milestone });
    }

    // Insert templates
    console.log('📄 Creating templates...');
    for (const template of content.templates) {
      await prisma.generatedTemplate.create({
        data: {
          ...template,
          userId: 'system' // System-generated templates
        }
      });
    }

    // Insert tips
    console.log('💡 Creating tips...');
    for (const tip of content.tips) {
      await prisma.quickTip.create({ data: tip });
    }

    console.log('\n✅ Phase 3 content parsing and seeding completed successfully!');

    // Final count
    const finalCounts = {
      tasks: await prisma.dailyTask.count(),
      milestones: await prisma.milestone.count(),
      templates: await prisma.generatedTemplate.count(),
      tips: await prisma.quickTip.count()
    };

    console.log('\n📊 Final Database Counts:');
    console.log(`- Daily Tasks: ${finalCounts.tasks}`);
    console.log(`- Milestones: ${finalCounts.milestones}`);
    console.log(`- Templates: ${finalCounts.templates}`);
    console.log(`- Quick Tips: ${finalCounts.tips}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { ResearchDocumentParser, main };