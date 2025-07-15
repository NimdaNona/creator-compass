import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create a test user
  const testUser = await prisma.user.upsert({
    where: { email: 'test@creatorsaicompass.com' },
    update: {},
    create: {
      email: 'test@creatorsaicompass.com',
      name: 'Test Creator',
      emailVerified: new Date(),
    },
  });

  console.log('✅ Created test user:', testUser.email);

  // Create user profile
  const userProfile = await prisma.userProfile.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      userId: testUser.id,
      selectedPlatform: 'youtube',
      selectedNiche: 'gaming',
      startDate: new Date(),
      currentPhase: 1,
      currentWeek: 1,
      goals: JSON.stringify(['Reach 1000 subscribers', 'Create consistent content']),
      targetTimeframe: 90,
      motivation: 'I want to build a community around gaming content',
      preferences: JSON.stringify({}),
    },
  });

  console.log('✅ Created user profile for platform:', userProfile.selectedPlatform);

  // Create initial stats
  const userStats = await prisma.userStats.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      userId: testUser.id,
      totalPoints: 0,
      streakDays: 0,
      longestStreak: 0,
      lastActiveDate: new Date(),
      totalTasksCompleted: 0,
      weeklyGoal: 5,
      monthlyGoal: 20,
    },
  });

  console.log('✅ Created user stats');

  // Create some sample progress
  const sampleTasks = [
    { taskId: 'setup-channel', phaseId: 'phase-1', weekId: 'week-1', points: 10 },
    { taskId: 'create-banner', phaseId: 'phase-1', weekId: 'week-1', points: 10 },
    { taskId: 'write-channel-description', phaseId: 'phase-1', weekId: 'week-1', points: 5 },
  ];

  for (const task of sampleTasks) {
    await prisma.userProgress.upsert({
      where: {
        userId_taskId: {
          userId: testUser.id,
          taskId: task.taskId,
        },
      },
      update: {},
      create: {
        userId: testUser.id,
        ...task,
        completedAt: new Date(),
      },
    });
  }

  console.log('✅ Created sample progress entries');

  // Create sample achievements
  await prisma.userAchievement.upsert({
    where: {
      userId_achievementId: {
        userId: testUser.id,
        achievementId: 'first_task',
      },
    },
    update: {},
    create: {
      userId: testUser.id,
      achievementId: 'first_task',
      type: 'progress',
      unlockedAt: new Date(),
    },
  });

  console.log('✅ Created sample achievement');

  console.log('🎉 Database seed completed!');
  console.log('📝 Note: Run "tsx prisma/seedTasks.ts" separately to seed daily tasks');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });