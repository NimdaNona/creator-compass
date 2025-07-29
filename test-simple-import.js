// Simple test to check if db is properly initialized in conversation module

// Mock the environment
process.env.NODE_ENV = 'development';

// Test 1: Direct import of db
console.log('Test 1: Direct import of db module');
try {
  const dbModule = require('./src/lib/db.js');
  console.log('✅ db module loaded');
  console.log('   - db exists:', !!dbModule.db);
  console.log('   - db.user exists:', !!dbModule.db?.user);
} catch (error) {
  console.error('❌ Error loading db module:', error.message);
}

// Test 2: Import conversation module
console.log('\nTest 2: Import conversation module');
try {
  const convModule = require('./src/lib/ai/conversation.js');
  console.log('✅ conversation module loaded');
  console.log('   - conversationManager exists:', !!convModule.conversationManager);
} catch (error) {
  console.error('❌ Error loading conversation module:', error.message);
  console.error('Stack:', error.stack?.split('\n').slice(0, 5).join('\n'));
}