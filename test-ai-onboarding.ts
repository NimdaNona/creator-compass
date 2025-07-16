// Test script for AI onboarding flow
// Run with: npx tsx test-ai-onboarding.ts

import { conversationManager } from './src/lib/ai/conversation';
import { userContextService } from './src/lib/ai/user-context';
import { prisma } from './src/lib/db';

async function testOnboardingFlow() {
  console.log('🧪 Testing AI Onboarding Flow...\n');
  
  // Create a test user
  const testUserId = 'test-user-' + Date.now();
  
  try {
    // Create test user in DB
    const user = await prisma.user.create({
      data: {
        id: testUserId,
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
      },
    });
    
    console.log('✅ Created test user:', user.email);
    
    // Create onboarding conversation
    const conversation = await conversationManager.createConversation(testUserId, {
      type: 'onboarding',
      step: 'welcome',
      responses: {},
    });
    
    console.log('✅ Created onboarding conversation:', conversation.id);
    
    // Simulate conversation flow
    const testMessages = [
      { input: '1', expectedStep: 'platform' },
      { input: 'Twitch', expectedStep: 'niche' },
      { input: 'gaming', expectedStep: 'equipment' },
      { input: 'I have a basic webcam and headset', expectedStep: 'goals' },
      { input: 'I want to build a community and eventually make this my full-time job', expectedStep: 'challenges' },
      { input: 'My biggest challenge is being consistent and knowing what games to stream', expectedStep: 'complete' },
    ];
    
    for (const test of testMessages) {
      console.log(`\n📝 User: "${test.input}"`);
      
      // Process message
      const response = await conversationManager.processUserMessage(
        conversation.id,
        test.input,
        { stream: false }
      );
      
      console.log(`🤖 AI: ${response}`);
      
      // Check conversation state
      const updatedConv = await conversationManager.getConversation(conversation.id);
      console.log(`📊 Current step: ${updatedConv?.context.step} (expected: ${test.expectedStep})`);
      
      if (updatedConv?.context.step !== test.expectedStep) {
        console.error(`❌ State mismatch! Expected ${test.expectedStep}, got ${updatedConv?.context.step}`);
        console.log('Context:', JSON.stringify(updatedConv?.context, null, 2));
      }
    }
    
    // Check if user profile was updated
    console.log('\n🔍 Checking user profile...');
    const userContext = await userContextService.getUserContext(testUserId);
    
    if (userContext) {
      console.log('✅ User profile updated:');
      console.log('  - Creator Level:', userContext.creatorLevel);
      console.log('  - Platform:', userContext.platform);
      console.log('  - Niche:', userContext.niche);
      console.log('  - Equipment:', userContext.equipment);
      console.log('  - Goals:', userContext.goals);
      console.log('  - Challenges:', userContext.challenges);
    } else {
      console.error('❌ User profile not found!');
    }
    
    // Clean up
    await prisma.aIConversation.delete({ where: { id: conversation.id } });
    await prisma.userAIProfile.deleteMany({ where: { userId: testUserId } });
    await prisma.profile.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
    
    console.log('\n✅ Test completed and cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    // Try to clean up
    try {
      await prisma.aIConversation.deleteMany({ where: { userId: testUserId } });
      await prisma.userAIProfile.deleteMany({ where: { userId: testUserId } });
      await prisma.profile.deleteMany({ where: { userId: testUserId } });
      await prisma.user.delete({ where: { id: testUserId } });
    } catch (cleanupError) {
      console.error('Failed to clean up:', cleanupError);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testOnboardingFlow().catch(console.error);