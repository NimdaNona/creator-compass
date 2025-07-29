// Direct database test
require('dotenv').config({ path: '.env.local' });

async function testDirectDB() {
  console.log('=== Direct Database Connection Test ===\n');
  
  try {
    // Test 1: Import without CommonJS
    console.log('1. Testing ES module import simulation...');
    delete require.cache[require.resolve('./src/lib/db')];
    
    // Test 2: Check environment
    console.log('2. Environment check:');
    console.log('   NODE_ENV:', process.env.NODE_ENV);
    console.log('   DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('   DATABASE_URL length:', process.env.DATABASE_URL?.length || 0);
    
    // Test 3: Import and test
    console.log('\n3. Importing database module...');
    const dbModule = require('./src/lib/db');
    console.log('   Module exports:', Object.keys(dbModule));
    console.log('   db exists:', !!dbModule.db);
    console.log('   prisma exists:', !!dbModule.prisma);
    
    // Test 4: Check Prisma client
    const { db } = dbModule;
    console.log('\n4. Checking Prisma client:');
    console.log('   db type:', typeof db);
    console.log('   db.user exists:', !!db?.user);
    console.log('   Available models:', db ? Object.keys(db).filter(k => !k.startsWith('_') && !k.startsWith('$')) : 'None');
    
    // Test 5: Simple query
    if (db?.user) {
      console.log('\n5. Running test query...');
      const count = await db.user.count();
      console.log('   ✅ User count:', count);
      
      // Test 6: Test aiConversation model
      console.log('\n6. Testing aiConversation model:');
      console.log('   db.aiConversation exists:', !!db.aiConversation);
      if (db.aiConversation) {
        const convCount = await db.aiConversation.count();
        console.log('   ✅ AI Conversation count:', convCount);
      }
    } else {
      console.log('\n5. ❌ Cannot run query - db.user is undefined');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
  
  console.log('\n=== Test Complete ===');
  process.exit(0);
}

testDirectDB();