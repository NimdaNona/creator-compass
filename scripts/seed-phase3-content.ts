import { PrismaClient } from '@prisma/client';
import ContentParser from '../src/lib/content-parser';
import { promises as fs } from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function seedPhase3Content() {
  console.log('🚀 Starting Phase 3 content seeding...\n');

  try {
    // Initialize content parser
    const parser = new ContentParser();

    // Clear existing data (optional - comment out if you want to preserve existing data)
    console.log('🧹 Clearing existing Phase 3 data...');
    await prisma.contentEngagement.deleteMany();
    await prisma.templateRating.deleteMany();
    await prisma.generatedTemplate.deleteMany();
    await prisma.contentRecommendation.deleteMany();
    await prisma.milestoneAchievement.deleteMany();
    await prisma.milestone.deleteMany();
    await prisma.taskCompletion.deleteMany();
    await prisma.dailyTask.deleteMany();
    await prisma.quickTip.deleteMany();

    // Parse YouTube content
    console.log('\n📺 Parsing YouTube Channel Playbooks...');
    const youtubeContent = await parseYouTubeFromRoadmap();
    
    // Create daily tasks for YouTube
    console.log(`Creating ${youtubeContent.tasks.length} YouTube tasks...`);
    for (const task of youtubeContent.tasks) {
      await prisma.dailyTask.create({
        data: task
      });
    }

    // Create milestones for YouTube
    console.log(`Creating ${youtubeContent.milestones.length} YouTube milestones...`);
    for (const milestone of youtubeContent.milestones) {
      await prisma.milestone.create({
        data: milestone
      });
    }

    // Create quick tips for YouTube
    console.log(`Creating ${youtubeContent.tips.length} YouTube quick tips...`);
    for (const tip of youtubeContent.tips) {
      await prisma.quickTip.create({
        data: tip
      });
    }

    // Parse TikTok content
    console.log('\n🎵 Parsing TikTok Content Creator Playbooks...');
    const tiktokContent = await parseTikTokFromRoadmap();
    
    // Create daily tasks for TikTok
    console.log(`Creating ${tiktokContent.tasks.length} TikTok tasks...`);
    for (const task of tiktokContent.tasks) {
      await prisma.dailyTask.create({
        data: task
      });
    }

    // Parse Twitch content
    console.log('\n🎮 Parsing Twitch Streaming Playbooks...');
    const twitchContent = await parseTwitchFromRoadmap();
    
    // Create daily tasks for Twitch
    console.log(`Creating ${twitchContent.tasks.length} Twitch tasks...`);
    for (const task of twitchContent.tasks) {
      await prisma.dailyTask.create({
        data: task
      });
    }

    // Create cross-platform milestones
    console.log('\n🏆 Creating cross-platform milestones...');
    const crossPlatformMilestones = [
      {
        name: 'First Week Complete',
        description: 'Complete your first week of content creation',
        requirement: { type: 'time_based', value: 7 },
        reward: { type: 'badge', value: 'week_warrior' },
        celebration: {
          type: 'modal',
          message: 'Amazing! You\'ve completed your first week!',
          sharePrompt: 'Share your progress with the community'
        },
        orderIndex: 1
      },
      {
        name: 'Consistency King',
        description: 'Maintain a 7-day streak',
        requirement: { type: 'metric_achievement', value: '7_day_streak' },
        reward: { type: 'badge', value: 'consistency_king' },
        celebration: {
          type: 'confetti',
          message: 'You\'re on fire! 7 days in a row!',
          sharePrompt: 'Share your streak achievement'
        },
        orderIndex: 2
      },
      {
        name: 'Task Master',
        description: 'Complete 50 tasks',
        requirement: { type: 'task_completion', value: 50 },
        reward: { type: 'feature_unlock', value: 'advanced_templates' },
        celebration: {
          type: 'modal',
          message: '50 tasks completed! You\'ve unlocked advanced templates!',
          sharePrompt: 'Share your milestone achievement'
        },
        orderIndex: 3
      }
    ];

    for (const milestone of crossPlatformMilestones) {
      await prisma.milestone.create({
        data: milestone
      });
    }

    console.log('\n✅ Phase 3 content seeding completed successfully!');
    
    // Print summary
    const taskCount = await prisma.dailyTask.count();
    const milestoneCount = await prisma.milestone.count();
    const tipCount = await prisma.quickTip.count();
    
    console.log('\n📊 Summary:');
    console.log(`- Daily Tasks: ${taskCount}`);
    console.log(`- Milestones: ${milestoneCount}`);
    console.log(`- Quick Tips: ${tipCount}`);

  } catch (error) {
    console.error('❌ Error seeding Phase 3 content:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Parse YouTube content from existing roadmap structure
async function parseYouTubeFromRoadmap() {
  const roadmapPath = path.join(process.cwd(), 'src/data/roadmaps.json');
  const roadmapData = JSON.parse(await fs.readFile(roadmapPath, 'utf-8'));
  
  const tasks: any[] = [];
  const milestones: any[] = [];
  const tips: any[] = [];

  // Extract YouTube gaming roadmap
  const youtubeGaming = roadmapData.roadmaps.youtube.gaming;
  
  for (const phase of youtubeGaming.phases) {
    if (phase.weeks) {
      for (const week of phase.weeks) {
        for (const task of week.dailyTasks) {
          const enhancedTask = {
            id: task.id,
            roadmapId: `youtube_gaming_${phase.id}_${week.id}`,
            platform: 'youtube',
            niche: 'gaming',
            phase: phase.phase,
            week: week.week,
            dayRange: task.dayRange,
            title: task.title,
            description: task.description,
            instructions: extractInstructionsFromDescription(task.description),
            timeEstimate: task.estimatedTime || 60,
            difficulty: determineDifficultyFromPhase(phase.phase),
            category: task.category,
            platformSpecific: {
              tips: task.metadata?.recording_tips || [],
              bestPractices: task.metadata?.editing_focus || [],
              commonMistakes: []
            },
            successMetrics: extractMetricsFromTask(task),
            resources: extractResourcesFromTask(task),
            orderIndex: tasks.length,
            metadata: task.metadata || {}
          };

          tasks.push(enhancedTask);
        }
      }
    }
    
    // Create phase milestones
    if (phase.goals) {
      for (let i = 0; i < phase.goals.length; i++) {
        const milestone = {
          name: phase.goals[i],
          description: `Achieve: ${phase.goals[i]}`,
          requirement: extractRequirementFromGoal(phase.goals[i]),
          reward: { type: 'badge', value: `phase${phase.phase}_goal${i + 1}` },
          celebration: {
            type: 'modal',
            message: `Incredible! You've achieved: ${phase.goals[i]}`,
            sharePrompt: 'Share this achievement with your followers'
          },
          platform: 'youtube',
          niche: 'gaming',
          orderIndex: milestones.length
        };

        milestones.push(milestone);
      }
    }
  }

  // Add YouTube-specific tips
  tips.push(
    {
      title: 'Optimal Upload Times',
      content: 'Upload your videos between 2-4 PM on weekdays for maximum initial engagement',
      category: 'growth',
      platform: 'youtube',
      niche: 'gaming',
      difficulty: 'beginner',
      tags: ['timing', 'engagement', 'algorithm'],
      source: 'YouTube Analytics Best Practices',
      isActive: true
    },
    {
      title: 'Thumbnail CTR Optimization',
      content: 'Use bright colors, clear text, and expressive faces to improve click-through rates',
      category: 'engagement',
      platform: 'youtube',
      difficulty: 'intermediate',
      tags: ['thumbnails', 'ctr', 'design'],
      source: 'YouTube Creator Insider',
      isActive: true
    }
  );

  return { tasks, milestones, tips };
}

// Parse TikTok content from existing roadmap structure
async function parseTikTokFromRoadmap() {
  const roadmapPath = path.join(process.cwd(), 'src/data/roadmaps.json');
  const roadmapData = JSON.parse(await fs.readFile(roadmapPath, 'utf-8'));
  
  const tasks: any[] = [];

  // Extract TikTok entertainment roadmap
  const tiktokEntertainment = roadmapData.roadmaps.tiktok.entertainment;
  
  for (const phase of tiktokEntertainment.phases) {
    if (phase.weeks) {
      for (const week of phase.weeks) {
        for (const task of week.dailyTasks) {
          const enhancedTask = {
            id: task.id,
            roadmapId: `tiktok_entertainment_${phase.id}_${week.id}`,
            platform: 'tiktok',
            niche: 'entertainment',
            phase: phase.phase,
            week: week.week,
            dayRange: task.dayRange,
            title: task.title,
            description: task.description,
            instructions: extractInstructionsFromDescription(task.description),
            timeEstimate: task.estimatedTime || 45,
            difficulty: 'beginner',
            category: task.category,
            platformSpecific: {
              tips: task.metadata?.video_tips || [],
              bestPractices: task.metadata?.hashtag_mix || [],
              commonMistakes: []
            },
            successMetrics: [
              { metric: 'views', target: '10000', howToMeasure: 'Check TikTok Analytics' },
              { metric: 'engagement_rate', target: '10%', howToMeasure: 'Calculate likes + comments / views' }
            ],
            resources: extractResourcesFromTask(task),
            orderIndex: tasks.length,
            metadata: task.metadata || {}
          };

          tasks.push(enhancedTask);
        }
      }
    }
  }

  return { tasks };
}

// Parse Twitch content from existing roadmap structure  
async function parseTwitchFromRoadmap() {
  const roadmapPath = path.join(process.cwd(), 'src/data/roadmaps.json');
  const roadmapData = JSON.parse(await fs.readFile(roadmapPath, 'utf-8'));
  
  const tasks: any[] = [];

  // Extract Twitch gaming roadmap
  const twitchGaming = roadmapData.roadmaps.twitch.gaming;
  
  for (const phase of twitchGaming.phases) {
    if (phase.weeks) {
      for (const week of phase.weeks) {
        for (const task of week.dailyTasks) {
          const enhancedTask = {
            id: task.id,
            roadmapId: `twitch_gaming_${phase.id}_${week.id}`,
            platform: 'twitch',
            niche: 'gaming',
            phase: phase.phase,
            week: week.week,
            dayRange: task.dayRange,
            title: task.title,
            description: task.description,
            instructions: extractInstructionsFromDescription(task.description),
            timeEstimate: task.estimatedTime || 120,
            difficulty: 'intermediate',
            category: task.category,
            platformSpecific: {
              tips: task.metadata?.engagement_tips || [],
              bestPractices: task.metadata?.checklist || [],
              commonMistakes: []
            },
            successMetrics: [
              { metric: 'average_viewers', target: '10', howToMeasure: 'Check Twitch Analytics' },
              { metric: 'followers', target: '50', howToMeasure: 'Track follower count' }
            ],
            resources: extractResourcesFromTask(task),
            orderIndex: tasks.length,
            metadata: task.metadata || {}
          };

          tasks.push(enhancedTask);
        }
      }
    }
  }

  return { tasks };
}

// Helper functions
function extractInstructionsFromDescription(description: string): string[] {
  const sentences = description.split(/[.!?]\s+/).filter(s => s.length > 10);
  return sentences.slice(0, 5); // Take first 5 sentences as instructions
}

function determineDifficultyFromPhase(phase: number): 'beginner' | 'intermediate' | 'advanced' {
  if (phase === 1) return 'beginner';
  if (phase === 2) return 'intermediate';
  return 'advanced';
}

function extractMetricsFromTask(task: any): any[] {
  const metrics = [];
  
  if (task.metadata?.optimal_time) {
    metrics.push({
      metric: 'posting_time',
      target: task.metadata.optimal_time,
      howToMeasure: 'Schedule posts at this time'
    });
  }
  
  if (task.description.includes('subscribers')) {
    metrics.push({
      metric: 'subscribers',
      target: '100',
      howToMeasure: 'Check YouTube Studio'
    });
  }
  
  return metrics;
}

function extractResourcesFromTask(task: any): any[] {
  const resources = [];
  
  if (task.metadata?.tools) {
    task.metadata.tools.forEach((tool: string) => {
      resources.push({
        type: 'tool',
        title: tool
      });
    });
  }
  
  if (task.metadata?.templates) {
    task.metadata.templates.forEach((template: string) => {
      resources.push({
        type: 'template',
        title: template
      });
    });
  }
  
  return resources;
}

function extractRequirementFromGoal(goal: string): any {
  const lowerGoal = goal.toLowerCase();
  
  if (lowerGoal.includes('subscriber')) {
    const match = goal.match(/(\d+)/);
    return { type: 'metric_achievement', value: `${match?.[1] || '100'}_subscribers` };
  }
  
  if (lowerGoal.includes('upload')) {
    const match = goal.match(/(\d+)/);
    return { type: 'task_completion', value: match?.[1] || '10' };
  }
  
  if (lowerGoal.includes('week') || lowerGoal.includes('day')) {
    return { type: 'time_based', value: '30' };
  }
  
  return { type: 'task_completion', value: '10' };
}

// Run the seeding script
seedPhase3Content()
  .then(() => {
    console.log('\n🎉 Seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  });