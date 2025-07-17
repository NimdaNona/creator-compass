// AI Configuration with runtime environment variable handling
export function getOpenAIApiKey(): string | undefined {
  // Try multiple ways to access the API key
  // This handles different runtime environments (local, Vercel, etc.)
  
  // 1. Standard process.env
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }
  
  // 2. Try runtime config (for Vercel)
  if (typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.OPENAI_API_KEY) {
    return (globalThis as any).process.env.OPENAI_API_KEY;
  }
  
  // 3. Try from runtime environment
  if (typeof process !== 'undefined' && process.env && process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }
  
  return undefined;
}

export const AI_CONFIG = {
  models: {
    chat: 'gpt-4-turbo-preview',
    embedding: 'text-embedding-3-small',
  },
  limits: {
    maxTokens: 2000,
    temperature: 0.7,
    rateLimit: {
      tokensPerInterval: 100,
      interval: 'minute' as const,
    },
  },
};