import { ContentGenerationType, PromptTemplate } from './types';

export const promptTemplates: Record<ContentGenerationType, PromptTemplate> = {
  bio: {
    systemPrompt: `You are an expert bio writer for CreatorCompass, a platform that provides personalized 90-day roadmaps for content creators on YouTube, TikTok, and Twitch. 
    You create compelling, SEO-optimized bios that reflect the creator's growth journey and align with CreatorCompass's mission of structured creator development.`,
    userPromptTemplate: `Create a professional bio for a {{platform}} creator in the {{niche}} niche.
    
    Additional context:
    - Target audience: {{targetAudience}}
    - Creator personality: {{personality}}
    - Key achievements: {{achievements}}
    - Unique value proposition: {{uniqueValue}}
    
    Requirements:
    - Keep it under {{maxLength}} characters
    - Include relevant keywords for {{niche}}
    - Make it engaging and action-oriented
    - Include a clear call-to-action`,
    temperature: 0.8,
    maxTokens: 500,
    buildPrompt: (context) => {
      let prompt = promptTemplates.bio.userPromptTemplate;
      Object.entries(context).forEach(([key, value]) => {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      });
      return prompt;
    },
  },

  'content-idea': {
    systemPrompt: `You are a creative content strategist for CreatorCompass, helping creators on YouTube, TikTok, and Twitch build successful channels through structured 90-day roadmaps. 
    You generate viral-worthy content ideas that align with their current roadmap phase and growth goals.`,
    userPromptTemplate: `Generate a unique content idea for {{platform}} in the {{niche}} niche.
    
    Context:
    - Current trends: {{trends}}
    - Audience interests: {{interests}}
    - Creator's style: {{style}}
    - Previous successful content: {{previousSuccess}}
    
    The idea should be:
    - Original and engaging
    - Feasible to create with {{equipment}}
    - Likely to get high engagement
    - Aligned with platform best practices`,
    temperature: 0.9,
    maxTokens: 800,
    buildPrompt: (context) => {
      let prompt = promptTemplates['content-idea'].userPromptTemplate;
      Object.entries(context).forEach(([key, value]) => {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      });
      return prompt;
    },
  },

  caption: {
    systemPrompt: `You are a social media copywriter for CreatorCompass, supporting creators on their 90-day growth journey. 
    You write engaging captions that align with their roadmap phase, whether they're just starting out or scaling their audience.`,
    userPromptTemplate: `Write a caption for a {{platform}} post about {{topic}}.
    
    Post details:
    - Content type: {{contentType}}
    - Target emotion: {{emotion}}
    - Call-to-action: {{cta}}
    - Tone: {{tone}}
    
    Requirements:
    - Start with a strong hook
    - Include relevant hashtags
    - Optimize for {{platform}} algorithm
    - Keep within platform limits`,
    temperature: 0.8,
    maxTokens: 600,
    buildPrompt: (context) => {
      let prompt = promptTemplates.caption.userPromptTemplate;
      Object.entries(context).forEach(([key, value]) => {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      });
      return prompt;
    },
  },

  'script-outline': {
    systemPrompt: `You are a professional scriptwriter for CreatorCompass, helping creators on YouTube, TikTok, and Twitch develop content that supports their 90-day roadmap goals. 
    You create scripts that match their current skill level and growth phase.`,
    userPromptTemplate: `Create a script outline for a {{duration}} {{platform}} video about {{topic}}.
    
    Video details:
    - Format: {{format}}
    - Target audience: {{audience}}
    - Key message: {{message}}
    - Desired outcome: {{outcome}}
    
    Include:
    - Attention-grabbing hook (0-3 seconds)
    - Clear structure with timestamps
    - Engagement points throughout
    - Strong call-to-action
    - B-roll suggestions`,
    temperature: 0.7,
    maxTokens: 1500,
    buildPrompt: (context) => {
      let prompt = promptTemplates['script-outline'].userPromptTemplate;
      Object.entries(context).forEach(([key, value]) => {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      });
      return prompt;
    },
  },

  'thumbnail-concept': {
    systemPrompt: `You are a visual content strategist for CreatorCompass, helping creators optimize their content for growth throughout their 90-day journey. 
    You design thumbnail concepts that match their current capabilities while pushing them toward professional standards.`,
    userPromptTemplate: `Design a thumbnail concept for a {{platform}} video titled "{{title}}".
    
    Video context:
    - Topic: {{topic}}
    - Target emotion: {{emotion}}
    - Competitor thumbnails: {{competitors}}
    
    Describe:
    - Main visual elements
    - Text overlay (if any)
    - Color scheme
    - Facial expression (if applicable)
    - Background elements`,
    temperature: 0.8,
    maxTokens: 600,
    buildPrompt: (context) => {
      let prompt = promptTemplates['thumbnail-concept'].userPromptTemplate;
      Object.entries(context).forEach(([key, value]) => {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      });
      return prompt;
    },
  },

  title: {
    systemPrompt: `You are a title optimization expert for CreatorCompass, helping creators on YouTube, TikTok, and Twitch craft titles that support their 90-day growth goals. 
    You create clickable, SEO-friendly titles appropriate for their current audience size and growth phase.`,
    userPromptTemplate: `Generate an optimized title for a {{platform}} video about {{topic}}.
    
    Requirements:
    - Include primary keyword: {{keyword}}
    - Evoke emotion: {{emotion}}
    - Stay under {{maxLength}} characters
    - Use proven title formulas
    - Avoid clickbait`,
    temperature: 0.8,
    maxTokens: 200,
    buildPrompt: (context) => {
      let prompt = promptTemplates.title.userPromptTemplate;
      Object.entries(context).forEach(([key, value]) => {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      });
      return prompt;
    },
  },

  description: {
    systemPrompt: `You are an SEO expert for CreatorCompass, supporting creators through their 90-day roadmap journey. 
    You write descriptions that grow with the creator, from basic optimization to advanced strategies as they progress.`,
    userPromptTemplate: `Write an SEO-optimized description for a {{platform}} video about {{topic}}.
    
    Include:
    - Brief summary
    - Timestamps: {{timestamps}}
    - Relevant keywords: {{keywords}}
    - Links mentioned: {{links}}
    - Social media links
    - Relevant hashtags`,
    temperature: 0.7,
    maxTokens: 1000,
    buildPrompt: (context) => {
      let prompt = promptTemplates.description.userPromptTemplate;
      Object.entries(context).forEach(([key, value]) => {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      });
      return prompt;
    },
  },

  hashtags: {
    systemPrompt: `You are a hashtag strategist for CreatorCompass, helping creators on TikTok, YouTube Shorts, and other platforms optimize their reach. 
    You select hashtags appropriate for their current growth phase in the 90-day roadmap.`,
    userPromptTemplate: `Generate hashtags for a {{platform}} post about {{topic}} in the {{niche}} niche.
    
    Requirements:
    - Mix of competition levels (high, medium, low)
    - Include {{count}} hashtags
    - Platform: {{platform}}
    - Avoid banned or overused tags`,
    temperature: 0.7,
    maxTokens: 300,
    buildPrompt: (context) => {
      let prompt = promptTemplates.hashtags.userPromptTemplate;
      Object.entries(context).forEach(([key, value]) => {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      });
      return prompt;
    },
  },

  hook: {
    systemPrompt: `You are a hook specialist for CreatorCompass, helping creators at all stages of their 90-day journey capture attention. 
    You create hooks that match their current skill level while teaching them advanced techniques.`,
    userPromptTemplate: `Create a powerful hook for a {{platform}} video about {{topic}}.
    
    Hook type: {{hookType}}
    Target emotion: {{emotion}}
    
    Make it:
    - Under 3 seconds when spoken
    - Immediately intriguing
    - Promise value
    - Create curiosity gap`,
    temperature: 0.9,
    maxTokens: 200,
    buildPrompt: (context) => {
      let prompt = promptTemplates.hook.userPromptTemplate;
      Object.entries(context).forEach(([key, value]) => {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      });
      return prompt;
    },
  },

  'call-to-action': {
    systemPrompt: `You are a conversion optimization expert for CreatorCompass, helping creators build engaged communities through their 90-day roadmap. 
    You craft CTAs appropriate for their current audience size and engagement goals.`,
    userPromptTemplate: `Create a call-to-action for a {{platform}} {{contentType}} about {{topic}}.
    
    Desired action: {{action}}
    Incentive: {{incentive}}
    Urgency level: {{urgency}}
    
    Make it:
    - Clear and specific
    - Value-focused
    - Easy to follow
    - Platform-appropriate`,
    temperature: 0.7,
    maxTokens: 200,
    buildPrompt: (context) => {
      let prompt = promptTemplates['call-to-action'].userPromptTemplate;
      Object.entries(context).forEach(([key, value]) => {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      });
      return prompt;
    },
  },

  'channel-description': {
    systemPrompt: `You are a channel optimization expert for CreatorCompass, helping creators on YouTube, TikTok, and Twitch build professional presences. 
    You write descriptions that reflect their 90-day roadmap journey and long-term growth vision.`,
    userPromptTemplate: `Write a channel description for a {{platform}} creator in the {{niche}} niche.
    
    Channel details:
    - Upload schedule: {{schedule}}
    - Content types: {{contentTypes}}
    - Unique value: {{uniqueValue}}
    - Target audience: {{audience}}
    
    Include:
    - Clear value proposition
    - Upload schedule
    - Content categories
    - Contact/business email
    - Social links`,
    temperature: 0.7,
    maxTokens: 800,
    buildPrompt: (context) => {
      let prompt = promptTemplates['channel-description'].userPromptTemplate;
      Object.entries(context).forEach(([key, value]) => {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      });
      return prompt;
    },
  },

  'video-tags': {
    systemPrompt: `You are a metadata optimization expert for CreatorCompass, helping creators improve their content discoverability throughout their 90-day journey. 
    You select tags that balance current reach with growth potential.`,
    userPromptTemplate: `Generate SEO-optimized tags for a {{platform}} video titled "{{title}}" about {{topic}}.
    
    Requirements:
    - Include {{count}} tags
    - Mix of broad and specific
    - Include variations and synonyms
    - Relevant to content
    - Avoid tag stuffing`,
    temperature: 0.6,
    maxTokens: 300,
    buildPrompt: (context) => {
      let prompt = promptTemplates['video-tags'].userPromptTemplate;
      Object.entries(context).forEach(([key, value]) => {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      });
      return prompt;
    },
  },
};