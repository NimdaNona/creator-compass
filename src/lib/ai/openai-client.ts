import OpenAI from 'openai';

/**
 * Creates a new OpenAI client instance
 * This avoids singleton issues in serverless environments
 */
export function createOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('[OpenAI Client] No API key found');
    console.error('[OpenAI Client] Environment:', {
      nodeEnv: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL,
      vercelEnv: process.env.VERCEL_ENV,
      hasKey: !!process.env.OPENAI_API_KEY,
    });
    throw new Error('OpenAI API key is not configured');
  }
  
  return new OpenAI({
    apiKey: apiKey.trim(),
    maxRetries: 3,
    timeout: 30000,
  });
}