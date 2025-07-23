import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Test endpoint to verify transaction rollback behavior
// This should only be enabled in development/test environments
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const results = {
    userCreationTest: false,
    taskCompletionTest: false,
    subscriptionTest: false,
  };

  // Test 1: User creation rollback
  try {
    const testEmail = `test-rollback-${Date.now()}@example.com`;
    
    try {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: testEmail,
            name: 'Test Rollback',
            password: 'hashed-password',
            emailVerificationToken: 'test-token',
          },
        });

        await tx.userProfile.create({
          data: {
            userId: user.id,
          },
        });

        // Force an error
        throw new Error('Simulated error');
      });
    } catch (error) {
      // Check if user was created
      const user = await prisma.user.findUnique({
        where: { email: testEmail },
      });
      
      results.userCreationTest = !user; // Success if user doesn't exist
    }
  } catch (error) {
    console.error('User creation test error:', error);
  }

  // Test 2: Task completion rollback
  try {
    const user = await prisma.user.findFirst({
      include: { stats: true },
    });

    if (user) {
      const initialPoints = user.stats?.totalPoints || 0;
      const testTaskId = 'test-task-' + Date.now();

      try {
        await prisma.$transaction(async (tx) => {
          await tx.taskCompletion.create({
            data: {
              userId: user.id,
              taskId: testTaskId,
            },
          });

          await tx.userStats.update({
            where: { userId: user.id },
            data: {
              totalPoints: { increment: 10 },
            },
          });

          // Force an error
          throw new Error('Simulated error');
        });
      } catch (error) {
        // Check if changes were rolled back
        const completion = await prisma.taskCompletion.findUnique({
          where: {
            userId_taskId: {
              userId: user.id,
              taskId: testTaskId,
            },
          },
        });

        const updatedUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: { stats: true },
        });

        const currentPoints = updatedUser?.stats?.totalPoints || 0;
        
        results.taskCompletionTest = !completion && currentPoints === initialPoints;
      }
    }
  } catch (error) {
    console.error('Task completion test error:', error);
  }

  // Test 3: Verify successful transaction
  try {
    const testEmail = `test-success-${Date.now()}@example.com`;
    let createdUserId: string | null = null;

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: testEmail,
          name: 'Test Success',
          password: 'hashed-password',
          emailVerificationToken: 'test-token',
        },
      });

      createdUserId = user.id;

      await tx.userProfile.create({
        data: {
          userId: user.id,
        },
      });

      await tx.userStats.create({
        data: {
          userId: user.id,
        },
      });
    });

    // Verify all records were created
    if (createdUserId) {
      const user = await prisma.user.findUnique({
        where: { id: createdUserId },
        include: {
          profile: true,
          stats: true,
        },
      });

      results.subscriptionTest = !!(user && user.profile && user.stats);

      // Clean up test data
      await prisma.user.delete({
        where: { id: createdUserId },
      });
    }
  } catch (error) {
    console.error('Success test error:', error);
  }

  const allTestsPassed = Object.values(results).every(result => result);

  return NextResponse.json({
    success: allTestsPassed,
    results,
    message: allTestsPassed 
      ? 'All transaction tests passed!' 
      : 'Some transaction tests failed',
  });
}