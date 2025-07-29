import { openai } from '@/lib/openai';
import { prisma } from '@/lib/db';
import { Platform } from '@/types';

export interface ScriptSection {
  type: 'hook' | 'intro' | 'main' | 'transition' | 'cta' | 'outro';
  content: string;
  duration?: number;
  notes?: string[];
  visualCues?: string[];
}

export interface GeneratedScript {
  id: string;
  title: string;
  platform: Platform['id'];
  format: string;
  totalDuration: number;
  sections: ScriptSection[];
  keywords: string[];
  tone: 'casual' | 'professional' | 'energetic' | 'educational' | 'inspirational';
  pacing: 'slow' | 'medium' | 'fast';
  callToActions: string[];
  platformOptimizations: {
    feature: string;
    description: string;
    implementation: string;
  }[];
  speakingNotes: {
    section: string;
    tip: string;
  }[];
  metadata: {
    wordCount: number;
    readingTime: number;
    complexity: 'simple' | 'moderate' | 'complex';
    targetAudience: string;
  };
  createdAt: Date;
}

export interface ScriptGenerationParams {
  userId: string;
  platform: Platform['id'];
  topic: string;
  duration: number; // in seconds
  style: 'casual' | 'professional' | 'energetic' | 'educational' | 'inspirational';
  outline?: string[];
  targetAudience?: string;
  includeHooks?: boolean;
  includeCTA?: boolean;
  keywords?: string[];
  tone?: string;
  references?: string[];
}

export class AIScriptWriter {
  private readonly platformFormats = {
    youtube: {
      shortForm: { min: 0, max: 60, name: 'YouTube Shorts' },
      standard: { min: 180, max: 900, name: 'Standard Video' },
      longForm: { min: 900, max: 3600, name: 'Long-form Content' }
    },
    tiktok: {
      quick: { min: 15, max: 30, name: 'Quick TikTok' },
      standard: { min: 30, max: 60, name: 'Standard TikTok' },
      extended: { min: 60, max: 180, name: 'Extended TikTok' }
    },
    twitch: {
      segment: { min: 300, max: 900, name: 'Stream Segment' },
      fullStream: { min: 3600, max: 14400, name: 'Full Stream' }
    }
  };

  async generateScript(params: ScriptGenerationParams): Promise<GeneratedScript> {
    try {
      const format = this.determineFormat(params.platform, params.duration);
      const systemPrompt = this.buildSystemPrompt(params);
      const userPrompt = this.buildUserPrompt(params, format);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      });

      const response = JSON.parse(completion.choices[0].message.content || '{}');
      const script = this.parseScriptResponse(response, params);
      
      // Store generated script
      await this.storeScript(params.userId, script);
      
      return script;
    } catch (error) {
      console.error('Error generating script:', error);
      throw new Error('Failed to generate script');
    }
  }

  async optimizeScript(
    scriptId: string, 
    optimizationType: 'engagement' | 'retention' | 'conversion'
  ): Promise<GeneratedScript> {
    try {
      const script = await this.getScript(scriptId);
      if (!script) throw new Error('Script not found');

      const optimizationPrompt = this.buildOptimizationPrompt(script, optimizationType);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert script optimization specialist focused on maximizing ' + optimizationType 
          },
          { role: 'user', content: optimizationPrompt }
        ],
        temperature: 0.6,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      });

      const response = JSON.parse(completion.choices[0].message.content || '{}');
      return this.parseScriptResponse(response, {
        ...script,
        title: script.title + ' (Optimized)',
        userId: ''
      });
    } catch (error) {
      console.error('Error optimizing script:', error);
      throw new Error('Failed to optimize script');
    }
  }

  private determineFormat(platform: string, duration: number): string {
    const formats = this.platformFormats[platform as keyof typeof this.platformFormats];
    if (!formats) return 'standard';

    for (const [key, format] of Object.entries(formats)) {
      if (duration >= format.min && duration <= format.max) {
        return format.name;
      }
    }

    return 'custom';
  }

  private buildSystemPrompt(params: ScriptGenerationParams): string {
    return `You are an expert scriptwriter specializing in ${params.platform} content creation.

Your expertise includes:
- Understanding platform-specific algorithms and best practices
- Creating engaging hooks that capture attention immediately
- Writing in various tones and styles to match creator personalities
- Optimizing content structure for maximum retention
- Incorporating strategic CTAs for audience growth

Key principles:
- Hook viewers in the first 3-5 seconds
- Maintain consistent pacing throughout
- Use pattern interrupts to maintain attention
- Include clear value propositions
- End with strong CTAs

Generate scripts that are immediately actionable and optimized for the platform's algorithm.`;
  }

  private buildUserPrompt(params: ScriptGenerationParams, format: string): string {
    const wordsPerSecond = 2.5; // Average speaking rate
    const targetWordCount = Math.floor(params.duration * wordsPerSecond);

    return `Create a ${params.duration}-second ${params.platform} script about "${params.topic}".

Format: ${format}
Style: ${params.style}
Target Audience: ${params.targetAudience || 'General audience'}
Target Word Count: ${targetWordCount} words (approximately)
Keywords to include: ${params.keywords?.join(', ') || 'None specified'}

${params.outline ? `Outline to follow:\n${params.outline.map((point, i) => `${i + 1}. ${point}`).join('\n')}` : ''}

Requirements:
1. Start with a compelling hook (first 3-5 seconds)
2. Structure the content for ${params.platform}'s algorithm
3. Include ${params.includeCTA ? 'clear CTAs' : 'subtle engagement prompts'}
4. Optimize pacing for ${params.duration} seconds
5. Add visual cues and speaking notes
6. Include platform-specific optimizations

Return a JSON object with:
- sections: Array of script sections with type, content, duration, notes, and visualCues
- keywords: Array of SEO keywords used
- tone: The overall tone of the script
- pacing: The pacing recommendation
- callToActions: Array of CTAs included
- platformOptimizations: Platform-specific features to leverage
- speakingNotes: Tips for delivery
- metadata: Word count, reading time, complexity, and target audience`;
  }

  private parseScriptResponse(response: any, params: ScriptGenerationParams): GeneratedScript {
    const id = `script-${Date.now()}`;
    
    return {
      id,
      title: response.title || `${params.platform} Script - ${params.topic}`,
      platform: params.platform,
      format: response.format || this.determineFormat(params.platform, params.duration),
      totalDuration: params.duration,
      sections: this.parseSections(response.sections || []),
      keywords: response.keywords || params.keywords || [],
      tone: response.tone || params.style,
      pacing: response.pacing || 'medium',
      callToActions: response.callToActions || [],
      platformOptimizations: response.platformOptimizations || [],
      speakingNotes: response.speakingNotes || [],
      metadata: {
        wordCount: response.metadata?.wordCount || 0,
        readingTime: response.metadata?.readingTime || params.duration,
        complexity: response.metadata?.complexity || 'moderate',
        targetAudience: response.metadata?.targetAudience || params.targetAudience || 'General'
      },
      createdAt: new Date()
    };
  }

  private parseSections(sections: any[]): ScriptSection[] {
    if (!Array.isArray(sections)) return [];

    return sections.map(section => ({
      type: section.type || 'main',
      content: section.content || '',
      duration: section.duration,
      notes: section.notes || [],
      visualCues: section.visualCues || []
    }));
  }

  private buildOptimizationPrompt(script: GeneratedScript, type: string): string {
    const optimizationGoals = {
      engagement: 'Maximize likes, comments, and shares',
      retention: 'Keep viewers watching until the end',
      conversion: 'Drive specific actions (subscribe, click, purchase)'
    };

    return `Optimize this ${script.platform} script for ${optimizationGoals[type as keyof typeof optimizationGoals]}.

Current Script:
${JSON.stringify(script, null, 2)}

Optimization Requirements:
1. Enhance hooks and pattern interrupts
2. Improve pacing and flow
3. Strengthen emotional connections
4. Add psychological triggers for ${type}
5. Optimize CTAs for maximum effectiveness

Maintain the core message while maximizing ${type}. Return the optimized script in the same JSON format.`;
  }

  private async storeScript(userId: string, script: GeneratedScript) {
    try {
      await prisma.generatedContent.create({
        data: {
          userId,
          type: 'script',
          title: script.title,
          content: JSON.stringify(script),
          platform: script.platform,
          status: 'draft'
        }
      });
    } catch (error) {
      console.error('Error storing script:', error);
      // Non-critical error
    }
  }

  async getScript(scriptId: string): Promise<GeneratedScript | null> {
    try {
      const stored = await prisma.generatedContent.findUnique({
        where: { id: scriptId }
      });

      if (!stored || stored.type !== 'script') return null;
      
      return JSON.parse(stored.content as string) as GeneratedScript;
    } catch (error) {
      console.error('Error retrieving script:', error);
      return null;
    }
  }

  async getUserScripts(userId: string, platform?: string): Promise<GeneratedScript[]> {
    try {
      const scripts = await prisma.generatedContent.findMany({
        where: {
          userId,
          type: 'script',
          ...(platform && { platform })
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      return scripts.map(s => JSON.parse(s.content as string) as GeneratedScript);
    } catch (error) {
      console.error('Error retrieving user scripts:', error);
      return [];
    }
  }

  estimateSpeakingTime(text: string): number {
    const words = text.split(/\s+/).length;
    const wordsPerMinute = 150; // Average speaking rate
    return Math.ceil((words / wordsPerMinute) * 60); // Return in seconds
  }

  async exportScript(
    scriptId: string, 
    format: 'text' | 'pdf' | 'teleprompter'
  ): Promise<string | Buffer> {
    const script = await this.getScript(scriptId);
    if (!script) throw new Error('Script not found');

    switch (format) {
      case 'text':
        return this.exportAsText(script);
      case 'teleprompter':
        return this.exportAsTeleprompter(script);
      case 'pdf':
        // PDF export would require additional library
        throw new Error('PDF export not implemented');
      default:
        throw new Error('Unsupported export format');
    }
  }

  private exportAsText(script: GeneratedScript): string {
    let output = `${script.title}\n`;
    output += `Platform: ${script.platform}\n`;
    output += `Duration: ${script.totalDuration} seconds\n`;
    output += `Style: ${script.tone}\n\n`;
    output += '='.repeat(50) + '\n\n';

    script.sections.forEach(section => {
      output += `[${section.type.toUpperCase()}]`;
      if (section.duration) {
        output += ` (${section.duration}s)`;
      }
      output += '\n\n';
      output += section.content + '\n\n';
      
      if (section.notes?.length) {
        output += 'Notes:\n';
        section.notes.forEach(note => output += `- ${note}\n`);
        output += '\n';
      }
      
      if (section.visualCues?.length) {
        output += 'Visual Cues:\n';
        section.visualCues.forEach(cue => output += `- ${cue}\n`);
        output += '\n';
      }
      
      output += '-'.repeat(30) + '\n\n';
    });

    if (script.callToActions.length) {
      output += '\nCALL TO ACTIONS:\n';
      script.callToActions.forEach(cta => output += `- ${cta}\n`);
    }

    return output;
  }

  private exportAsTeleprompter(script: GeneratedScript): string {
    // Format optimized for teleprompter reading
    let output = '';
    
    script.sections.forEach(section => {
      // Add section markers in a subtle way
      output += `[${section.type}]\n\n`;
      
      // Break content into shorter lines for easier reading
      const sentences = section.content.split(/(?<=[.!?])\s+/);
      sentences.forEach(sentence => {
        // Break long sentences into chunks
        const words = sentence.split(' ');
        let line = '';
        
        words.forEach(word => {
          if ((line + ' ' + word).length > 60) {
            output += line.trim() + '\n';
            line = word;
          } else {
            line += (line ? ' ' : '') + word;
          }
        });
        
        if (line) output += line.trim() + '\n\n';
      });
      
      output += '\n\n';
    });

    return output;
  }
}

export const scriptWriter = new AIScriptWriter();