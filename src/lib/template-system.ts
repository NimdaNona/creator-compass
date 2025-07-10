export interface TemplateVariable {
  key: string;
  label: string;
  type: 'text' | 'select' | 'number' | 'date' | 'boolean';
  placeholder?: string;
  options?: { value: string; label: string }[];
  defaultValue?: any;
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface Template {
  id: string;
  category: string;
  type: string;
  title: string;
  description?: string;
  content: string;
  variables: TemplateVariable[];
  platform: string;
  niche: string;
  tags?: string[];
  examples?: string[];
}

export interface CustomizedTemplate {
  template: Template;
  values: Record<string, any>;
  preview: string;
}

export class TemplateEngine {
  /**
   * Process template with variable substitution
   */
  static processTemplate(template: string, values: Record<string, any>): string {
    let processed = template;

    // Replace variables in the format {{variableName}}
    Object.entries(values).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      processed = processed.replace(regex, String(value || ''));
    });

    // Replace conditional blocks {{#if condition}}...{{/if}}
    processed = this.processConditionals(processed, values);

    // Replace loops {{#each array}}...{{/each}}
    processed = this.processLoops(processed, values);

    return processed;
  }

  /**
   * Process conditional blocks
   */
  private static processConditionals(template: string, values: Record<string, any>): string {
    const conditionalRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;
    
    return template.replace(conditionalRegex, (match, condition, content) => {
      const value = values[condition];
      return value ? content : '';
    });
  }

  /**
   * Process loop blocks
   */
  private static processLoops(template: string, values: Record<string, any>): string {
    const loopRegex = /{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g;
    
    return template.replace(loopRegex, (match, arrayName, content) => {
      const array = values[arrayName];
      if (!Array.isArray(array)) return '';
      
      return array.map((item, index) => {
        let itemContent = content;
        
        // Replace {{this}} with the current item
        itemContent = itemContent.replace(/{{this}}/g, String(item));
        
        // Replace {{@index}} with the current index
        itemContent = itemContent.replace(/{{@index}}/g, String(index));
        
        // If item is an object, replace its properties
        if (typeof item === 'object' && item !== null) {
          Object.entries(item).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            itemContent = itemContent.replace(regex, String(value || ''));
          });
        }
        
        return itemContent;
      }).join('');
    });
  }

  /**
   * Validate template variables
   */
  static validateVariables(
    variables: TemplateVariable[], 
    values: Record<string, any>
  ): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    variables.forEach(variable => {
      const value = values[variable.key];

      // Check required
      if (variable.required && !value) {
        errors[variable.key] = `${variable.label} is required`;
        return;
      }

      // Skip validation if not required and empty
      if (!value) return;

      // Type-specific validation
      switch (variable.type) {
        case 'number':
          if (isNaN(Number(value))) {
            errors[variable.key] = `${variable.label} must be a number`;
          } else if (variable.validation) {
            const num = Number(value);
            if (variable.validation.min !== undefined && num < variable.validation.min) {
              errors[variable.key] = `${variable.label} must be at least ${variable.validation.min}`;
            }
            if (variable.validation.max !== undefined && num > variable.validation.max) {
              errors[variable.key] = `${variable.label} must be at most ${variable.validation.max}`;
            }
          }
          break;

        case 'text':
          if (variable.validation?.pattern) {
            const regex = new RegExp(variable.validation.pattern);
            if (!regex.test(String(value))) {
              errors[variable.key] = variable.validation.message || `${variable.label} format is invalid`;
            }
          }
          break;

        case 'select':
          if (variable.options && !variable.options.some(opt => opt.value === value)) {
            errors[variable.key] = `Invalid option selected for ${variable.label}`;
          }
          break;
      }
    });

    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }
}

// Pre-defined template categories
export const TEMPLATE_CATEGORIES = {
  VIDEO_SCRIPT: {
    id: 'video_script',
    label: 'Video Scripts',
    types: {
      HOOK: { id: 'hook', label: 'Hooks & Intros' },
      STRUCTURE: { id: 'structure', label: 'Video Structures' },
      OUTRO: { id: 'outro', label: 'Outros & CTAs' },
      STORY: { id: 'story', label: 'Storytelling' }
    }
  },
  THUMBNAIL: {
    id: 'thumbnail',
    label: 'Thumbnails',
    types: {
      LAYOUT: { id: 'layout', label: 'Layouts' },
      TEXT: { id: 'text', label: 'Text Styles' },
      COLOR: { id: 'color', label: 'Color Schemes' }
    }
  },
  DESCRIPTION: {
    id: 'description',
    label: 'Descriptions',
    types: {
      VIDEO: { id: 'video', label: 'Video Descriptions' },
      CHANNEL: { id: 'channel', label: 'Channel Descriptions' },
      ABOUT: { id: 'about', label: 'About Sections' }
    }
  },
  SOCIAL_MEDIA: {
    id: 'social_media',
    label: 'Social Media',
    types: {
      ANNOUNCEMENT: { id: 'announcement', label: 'Announcements' },
      CROSS_PROMO: { id: 'cross_promo', label: 'Cross-Promotion' },
      COMMUNITY: { id: 'community', label: 'Community Posts' }
    }
  }
};

// Sample templates
export const SAMPLE_TEMPLATES: Template[] = [
  {
    id: 'youtube_hook_problem_solver',
    category: 'video_script',
    type: 'hook',
    title: 'Problem Solver Hook',
    description: 'Hook viewers by addressing a common problem',
    content: `You won't believe what happened when I tried {{problem}}.

{{#if statistics}}
Did you know that {{statistics}} people struggle with this same issue?
{{/if}}

In this video, I'm going to show you exactly how to {{solution}} in just {{timeframe}}.

{{#if guarantee}}
And the best part? {{guarantee}}
{{/if}}`,
    variables: [
      {
        key: 'problem',
        label: 'Problem/Pain Point',
        type: 'text',
        placeholder: 'e.g., to grow my YouTube channel',
        required: true
      },
      {
        key: 'statistics',
        label: 'Statistics (optional)',
        type: 'text',
        placeholder: 'e.g., 90% of',
        required: false
      },
      {
        key: 'solution',
        label: 'Solution',
        type: 'text',
        placeholder: 'e.g., gain 1000 subscribers',
        required: true
      },
      {
        key: 'timeframe',
        label: 'Timeframe',
        type: 'text',
        placeholder: 'e.g., 30 days',
        required: true
      },
      {
        key: 'guarantee',
        label: 'Guarantee/Promise (optional)',
        type: 'text',
        placeholder: 'e.g., It works even if you\'re a complete beginner',
        required: false
      }
    ],
    platform: 'youtube',
    niche: 'general',
    tags: ['hook', 'problem-solving', 'engagement']
  },
  {
    id: 'youtube_description_seo',
    category: 'description',
    type: 'video',
    title: 'SEO-Optimized Video Description',
    description: 'Video description template optimized for search',
    content: `{{title}}

In this video, {{brief_description}}

⏱️ TIMESTAMPS:
{{#each timestamps}}
{{time}} - {{topic}}
{{/each}}

🔥 KEY TAKEAWAYS:
{{#each takeaways}}
• {{this}}
{{/each}}

📱 CONNECT WITH ME:
{{#if social_instagram}}Instagram: {{social_instagram}}{{/if}}
{{#if social_twitter}}Twitter: {{social_twitter}}{{/if}}
{{#if social_tiktok}}TikTok: {{social_tiktok}}{{/if}}

🏷️ TAGS:
{{#each tags}}#{{this}} {{/each}}

{{#if affiliate_disclosure}}
📝 DISCLOSURE: {{affiliate_disclosure}}
{{/if}}`,
    variables: [
      {
        key: 'title',
        label: 'Video Title',
        type: 'text',
        required: true
      },
      {
        key: 'brief_description',
        label: 'Brief Description',
        type: 'text',
        placeholder: 'One sentence about your video',
        required: true
      },
      {
        key: 'timestamps',
        label: 'Timestamps',
        type: 'text',
        placeholder: 'Format: time - topic (one per line)',
        required: false
      },
      {
        key: 'takeaways',
        label: 'Key Takeaways',
        type: 'text',
        placeholder: 'Main points (one per line)',
        required: true
      },
      {
        key: 'tags',
        label: 'Hashtags',
        type: 'text',
        placeholder: 'Comma separated tags',
        required: true
      }
    ],
    platform: 'youtube',
    niche: 'general',
    tags: ['description', 'seo', 'youtube']
  }
];