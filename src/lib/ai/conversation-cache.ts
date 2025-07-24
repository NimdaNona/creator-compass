// Module-level singleton cache for conversations
// This ensures the cache persists across different module imports in Turbopack

import { AIConversation } from './types';

// Use module-level cache instead of globalThis to avoid Turbopack issues
let conversationCache: Map<string, AIConversation> | undefined;
let conversationManagerInstance: any | undefined;

export function getConversationCache(): Map<string, AIConversation> {
  if (!conversationCache) {
    conversationCache = new Map<string, AIConversation>();
    console.log('[ConversationCache] Initialized new cache');
  }
  return conversationCache;
}

export function getConversationManager(): any {
  return conversationManagerInstance;
}

export function setConversationManager(instance: any): void {
  conversationManagerInstance = instance;
  console.log('[ConversationCache] Manager instance set');
}