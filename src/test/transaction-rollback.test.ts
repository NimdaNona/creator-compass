import { prisma } from '@/lib/db';

/**
 * Test transaction rollback behavior
 * This file contains test cases to verify that database transactions
 * properly rollback when errors occur during multi-table operations
 */

// Test case 1: User creation rollback
async function testUserCreationRollback() {
  console.log('Testing user creation rollback...');
  
  const testEmail = `test-rollback-${Date.now()}@example.com`;
  
  try {
    await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: testEmail,
          name: 'Test Rollback',
          password: 'hashed-password',
          emailVerificationToken: 'test-token',
        },
      });
      
      console.log('User created:', user.id);
      
      // Create profile
      await tx.userProfile.create({
        data: {
          userId: user.id,
        },
      });
      
      console.log('Profile created');
      
      // Create stats - intentionally fail
      await tx.userStats.create({
        data: {
          userId: user.id,
          // Force an error by violating a constraint
          // @ts-ignore - intentionally passing invalid data
          invalidField: 'This will cause an error',
        },
      });
      
      console.log('This should not be reached');
    });
  } catch (error) {
    console.log('Transaction failed as expected:', error.message);
    
    // Verify user was not created
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
    });
    
    if (!user) {
      console.log('✅ User creation successfully rolled back');
    } else {
      console.error('❌ User was created despite transaction failure');
    }
  }
}

// Test case 2: Task completion rollback
async function testTaskCompletionRollback() {
  console.log('\nTesting task completion rollback...');
  
  // First, get a real user
  const user = await prisma.user.findFirst({
    include: { stats: true },
  });
  
  if (!user) {
    console.log('No users found for testing');
    return;
  }
  
  const initialPoints = user.stats?.totalPoints || 0;
  const testTaskId = 'test-task-' + Date.now();
  
  try {
    await prisma.$transaction(async (tx) => {
      // Create task completion
      await tx.taskCompletion.create({
        data: {
          userId: user.id,
          taskId: testTaskId,
        },
      });
      
      console.log('Task completion created');
      
      // Update user stats
      await tx.userStats.update({
        where: { userId: user.id },
        data: {
          totalPoints: { increment: 10 },
          totalTasksCompleted: { increment: 1 },
        },
      });
      
      console.log('Stats updated');
      
      // Force an error
      throw new Error('Simulated error to test rollback');
    });
  } catch (error) {
    console.log('Transaction failed as expected:', error.message);
    
    // Verify task completion was not created
    const completion = await prisma.taskCompletion.findUnique({
      where: {
        userId_taskId: {
          userId: user.id,
          taskId: testTaskId,
        },
      },
    });
    
    // Verify points were not updated
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { stats: true },
    });
    
    const currentPoints = updatedUser?.stats?.totalPoints || 0;
    
    if (!completion && currentPoints === initialPoints) {
      console.log('✅ Task completion successfully rolled back');
    } else {
      console.error('❌ Transaction changes were not rolled back properly');
      if (completion) console.error('  - Task completion exists');
      if (currentPoints !== initialPoints) console.error('  - Points were updated');
    }
  }
}

// Test case 3: Subscription update rollback
async function testSubscriptionUpdateRollback() {
  console.log('\nTesting subscription update rollback...');
  
  const user = await prisma.user.findFirst({
    include: { subscription: true },
  });
  
  if (!user) {
    console.log('No users found for testing');
    return;
  }
  
  const originalPlan = user.subscription?.plan || 'free';
  
  try {
    await prisma.$transaction(async (tx) => {
      // Update subscription
      await tx.userSubscription.upsert({
        where: { userId: user.id },
        update: {
          plan: 'pro',
          status: 'active',
        },
        create: {
          userId: user.id,
          plan: 'pro',
          status: 'active',
        },
      });
      
      console.log('Subscription updated');
      
      // Try to create a payment with invalid data
      await tx.payment.create({
        data: {
          userId: user.id,
          // @ts-ignore - intentionally missing required fields
          amount: -1000, // Invalid negative amount
        },
      });
    });
  } catch (error) {
    console.log('Transaction failed as expected:', error.message);
    
    // Verify subscription was not updated
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { subscription: true },
    });
    
    const currentPlan = updatedUser?.subscription?.plan || 'free';
    
    if (currentPlan === originalPlan) {
      console.log('✅ Subscription update successfully rolled back');
    } else {
      console.error('❌ Subscription was updated despite transaction failure');
    }
  }
}

// Run all tests
async function runTransactionTests() {
  console.log('=== Transaction Rollback Tests ===\n');
  
  try {
    await testUserCreationRollback();
    await testTaskCompletionRollback();
    await testSubscriptionUpdateRollback();
    
    console.log('\n=== All tests completed ===');
  } catch (error) {
    console.error('Test suite error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Export for use in test runners
export { runTransactionTests };

// Run tests if executed directly
if (require.main === module) {
  runTransactionTests();
}