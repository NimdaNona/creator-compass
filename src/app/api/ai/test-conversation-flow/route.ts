import { NextRequest, NextResponse } from 'next/server';
import { conversationManager } from '@/lib/ai/conversation';

export async function GET(request: NextRequest) {
  try {
    console.log('=== Starting Conversation Flow Test ===');
    
    // Step 1: Create conversation
    const userId = 'test-user-' + Date.now();
    console.log('Creating conversation for user:', userId);
    
    const conversation = await conversationManager.createConversation(userId, {
      type: 'test',
      source: 'flow-test'
    });
    
    console.log('Created conversation:', {
      id: conversation.id,
      userId: conversation.userId,
      contextType: conversation.context.type
    });
    
    // Step 2: Immediately try to retrieve it
    console.log('Retrieving conversation:', conversation.id);
    const retrieved = await conversationManager.getConversation(conversation.id);
    
    console.log('Retrieved conversation:', {
      found: !!retrieved,
      id: retrieved?.id,
      matches: retrieved?.id === conversation.id
    });
    
    // Step 3: Try to add a message
    console.log('Adding message to conversation');
    try {
      await conversationManager.addMessage(conversation.id, 'user', 'Test message');
      console.log('Message added successfully');
    } catch (error: any) {
      console.error('Failed to add message:', error.message);
      throw error;
    }
    
    // Step 4: Process a full message
    console.log('Processing user message');
    const response = await conversationManager.processUserMessage(
      conversation.id,
      'Hello, this is a test!',
      { stream: false }
    ) as string;
    
    console.log('Response received:', {
      responseLength: response.length,
      responsePreview: response.substring(0, 100)
    });
    
    return NextResponse.json({
      success: true,
      conversationId: conversation.id,
      steps: {
        create: 'success',
        retrieve: retrieved ? 'success' : 'failed',
        addMessage: 'success',
        processMessage: 'success'
      },
      response: response
    });
    
  } catch (error: any) {
    console.error('Flow test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 10)
    }, { status: 500 });
  }
}