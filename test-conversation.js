// Test conversation module import
const path = require('path');

// Set up module aliases
require('module-alias/register');
const moduleAlias = require('module-alias');
moduleAlias.addAlias('@', path.resolve(__dirname, 'src'));

async function testConversation() {
  try {
    console.log('1. Testing conversation module import...');
    
    // Import the conversation module
    const { conversationManager } = await import('./src/lib/ai/conversation.js');
    console.log('   - conversationManager imported:', !!conversationManager);
    
    // Test creating a conversation
    console.log('\n2. Testing conversation creation...');
    const userId = 'onboarding-test123';
    const context = { type: 'onboarding', step: 'welcome' };
    
    try {
      const conversation = await conversationManager.createConversation(userId, context);
      console.log('   ✅ Conversation created:', conversation.id);
    } catch (error) {
      console.error('   ❌ Error creating conversation:', error.message);
      console.error('   Stack:', error.stack);
    }
    
  } catch (error) {
    console.error('❌ Import error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testConversation();