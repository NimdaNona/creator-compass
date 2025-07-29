import { NextRequest, NextResponse } from 'next/server';
import { conversationManager } from '@/lib/ai/conversation';

export async function GET(request: NextRequest) {
  try {
    // Get global cache info
    const globalForConversation = globalThis as any;
    
    const response = {
      success: true,
      globalCacheExists: !!globalForConversation.conversationCache,
      globalCacheSize: globalForConversation.conversationCache?.size || 0,
      globalManagerExists: !!globalForConversation.conversationManager,
      conversationManagerInstance: conversationManager ? 'exists' : 'null',
      // Test creating and retrieving a conversation
      test: null as any
    };

    // Test conversation creation and retrieval
    const testConv = await conversationManager.createConversation('test-user-123', { type: 'test' });
    const retrieved = await conversationManager.getConversation(testConv.id);
    
    response.test = {
      created: !!testConv,
      createdId: testConv.id,
      retrieved: !!retrieved,
      retrievedId: retrieved?.id,
      match: testConv.id === retrieved?.id
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Cache test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 10)
    });
  }
}