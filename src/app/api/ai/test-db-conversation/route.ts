import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== Testing Database Conversation Creation ===');
    
    // Test 1: Dynamic import of db
    const { db } = await import('@/lib/db');
    console.log('Database imported:', !!db);
    
    // Test 2: Check aIConversation model
    console.log('Models available:', Object.keys(db));
    console.log('aIConversation exists:', !!db.aIConversation);
    
    // Test 3: Create a test conversation directly in database
    const testId = `test_${Date.now()}`;
    const testUserId = `test-user-${Date.now()}`;
    
    // Check if user already exists first
    let userExists = false;
    try {
      const existingUser = await db.user.findUnique({
        where: { id: testUserId },
      });
      userExists = !!existingUser;
      console.log('User exists check:', userExists);
    } catch (checkError) {
      console.log('Error checking user existence:', checkError);
    }
    
    if (!userExists) {
      try {
        // Create test user with all required fields
        const user = await db.user.create({
          data: {
            id: testUserId,
            email: `${testUserId}@test.local`,
            emailVerified: null, // Use null instead of boolean
            createdAt: new Date(),
            updatedAt: new Date(),
            name: 'Test User',
          },
        });
        console.log('Test user created:', user.id);
      } catch (userError: any) {
        console.log('User creation error:', userError);
        console.log('Error code:', userError.code);
        console.log('Error message:', userError.message);
        throw userError; // Re-throw to see the actual error
      }
    }
    
    // Create conversation
    const conversation = await db.aIConversation.create({
      data: {
        id: testId,
        userId: testUserId,
        messages: [],
        context: { test: true },
      },
    });
    console.log('Conversation created:', conversation.id);
    
    // Test 4: Retrieve it immediately
    const retrieved = await db.aIConversation.findUnique({
      where: { id: testId },
    });
    console.log('Retrieved conversation:', !!retrieved);
    
    // Test 5: Update it
    const updated = await db.aIConversation.update({
      where: { id: testId },
      data: {
        messages: [{ role: 'user', content: 'test', timestamp: new Date() }],
      },
    });
    console.log('Updated conversation:', !!updated);
    
    // Test 6: Clean up
    await db.aIConversation.delete({
      where: { id: testId },
    });
    console.log('Cleaned up conversation');
    
    return NextResponse.json({
      success: true,
      tests: {
        dbImport: 'passed',
        modelExists: 'passed',
        create: 'passed',
        retrieve: 'passed',
        update: 'passed',
        cleanup: 'passed',
      },
    });
    
  } catch (error: any) {
    console.error('Test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      stack: error.stack?.split('\n').slice(0, 10),
    }, { status: 500 });
  }
}