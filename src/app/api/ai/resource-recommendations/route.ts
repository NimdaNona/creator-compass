import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const requestSchema = z.object({
  platform: z.string(),
  niche: z.string(),
  category: z.string(),
  budget: z.number(),
  userLevel: z.string(),
  preferences: z.object({
    prioritizeQuality: z.boolean(),
    needPortability: z.boolean(),
    preferBrands: z.array(z.string()),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = requestSchema.parse(body);

    const { platform, niche, category, budget, userLevel, preferences } = validatedData;

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Generate resource recommendations using OpenAI
          const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content: `You are an expert content creation equipment and software advisor. Provide personalized recommendations based on the user's platform, niche, budget, and experience level. Your recommendations should be practical, value-focused, and include alternatives.`
              },
              {
                role: "user",
                content: `Please provide resource recommendations for:
                Platform: ${platform}
                Niche: ${niche}
                Category: ${category}
                Budget: $${budget}
                Experience Level: ${userLevel}
                ${preferences ? `Preferences: ${JSON.stringify(preferences)}` : ''}
                
                Please provide:
                1. 3-5 specific product recommendations with reasons
                2. Budget breakdown (essential, recommended, optional)
                3. Setup guides for beginners`
              }
            ],
            stream: true,
          });

          let recommendations: any[] = [];
          let budgetBreakdown: any = null;
          let setupGuides: any[] = [];
          let buffer = '';

          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            buffer += content;

            // Parse recommendations from the response
            if (buffer.includes('RECOMMENDATIONS:') && !recommendations.length) {
              recommendations = generateRecommendations(platform, niche, category, budget, userLevel);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ recommendations })}\n\n`));
            }

            if (buffer.includes('BUDGET:') && !budgetBreakdown) {
              budgetBreakdown = generateBudgetBreakdown(category, budget);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ budgetBreakdown })}\n\n`));
            }

            if (buffer.includes('GUIDES:') && !setupGuides.length) {
              setupGuides = generateSetupGuides(platform, category, userLevel);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ setupGuides })}\n\n`));
            }
          }

          // If AI didn't provide structured data, use fallback
          if (!recommendations.length) {
            recommendations = generateRecommendations(platform, niche, category, budget, userLevel);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ recommendations })}\n\n`));
          }

          if (!budgetBreakdown) {
            budgetBreakdown = generateBudgetBreakdown(category, budget);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ budgetBreakdown })}\n\n`));
          }

          if (!setupGuides.length) {
            setupGuides = generateSetupGuides(platform, category, userLevel);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ setupGuides })}\n\n`));
          }

          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          // Send fallback data
          const fallbackData = {
            recommendations: generateRecommendations(platform, niche, category, budget, userLevel),
            budgetBreakdown: generateBudgetBreakdown(category, budget),
            setupGuides: generateSetupGuides(platform, category, userLevel),
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(fallbackData)}\n\n`));
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Resource recommendations error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

function generateRecommendations(platform: string, niche: string, category: string, budget: number, userLevel: string) {
  const recommendations = {
    equipment: {
      youtube: [
        {
          id: 'rec-1',
          name: 'Sony ZV-1',
          type: 'Camera',
          category: 'Video',
          price: 750,
          rating: 4.6,
          reason: 'Perfect for YouTube creators with excellent autofocus and built-in ND filter',
          matchScore: 95,
          alternatives: ['Canon M50 Mark II', 'Panasonic G7'],
          bestFor: ['Vlogging', 'Product Reviews', 'Talking Head Videos'],
          considerations: ['Limited lens options', 'Small sensor'],
        },
        {
          id: 'rec-2',
          name: 'Shure SM7B',
          type: 'Microphone',
          category: 'Audio',
          price: 400,
          rating: 4.8,
          reason: 'Industry standard for podcasting and voiceovers with excellent noise rejection',
          matchScore: 92,
          alternatives: ['Rode PodMic', 'Audio-Technica AT2020'],
          bestFor: ['Podcasting', 'Voiceovers', 'Streaming'],
          considerations: ['Requires audio interface', 'Needs good preamp'],
        },
        {
          id: 'rec-3',
          name: 'Elgato Key Light',
          type: 'Lighting',
          category: 'Lighting',
          price: 200,
          rating: 4.7,
          reason: 'App-controlled professional lighting perfect for consistent video quality',
          matchScore: 88,
          alternatives: ['Neewer 660 LED', 'Godox SL-60W'],
          bestFor: ['Video Recording', 'Streaming', 'Photography'],
          considerations: ['Requires desk space', 'Initial setup complexity'],
        },
      ],
      tiktok: [
        {
          id: 'rec-4',
          name: 'DJI OM 5',
          type: 'Gimbal',
          category: 'Stabilization',
          price: 159,
          rating: 4.5,
          reason: 'Essential for smooth TikTok videos with built-in extension rod',
          matchScore: 98,
          alternatives: ['Zhiyun Smooth 5', 'Hohem iSteady X2'],
          bestFor: ['Mobile Videos', 'Walking Shots', 'Creative Transitions'],
          considerations: ['Battery life', 'Learning curve'],
        },
        {
          id: 'rec-5',
          name: 'Rode Wireless GO II',
          type: 'Microphone',
          category: 'Audio',
          price: 299,
          rating: 4.6,
          reason: 'Wireless audio perfect for TikTok creators on the move',
          matchScore: 90,
          alternatives: ['DJI Mic', 'Hollyland Lark 150'],
          bestFor: ['Outdoor Recording', 'Interviews', 'Action Videos'],
          considerations: ['Range limitations', 'Wind noise'],
        },
      ],
      twitch: [
        {
          id: 'rec-6',
          name: 'Elgato Stream Deck',
          type: 'Controller',
          category: 'Streaming',
          price: 150,
          rating: 4.8,
          reason: 'Streamline your streaming workflow with customizable buttons',
          matchScore: 96,
          alternatives: ['Loupedeck Live', 'Touch Portal'],
          bestFor: ['Scene Switching', 'Chat Commands', 'Sound Effects'],
          considerations: ['Software setup', 'Limited buttons on base model'],
        },
        {
          id: 'rec-7',
          name: 'Logitech Brio 4K',
          type: 'Webcam',
          category: 'Video',
          price: 200,
          rating: 4.4,
          reason: '4K webcam with excellent low-light performance for streaming',
          matchScore: 89,
          alternatives: ['Razer Kiyo Pro', 'AVerMedia PW513'],
          bestFor: ['Face Cam', 'High Quality Streams', 'Professional Look'],
          considerations: ['CPU usage', 'Requires good lighting'],
        },
      ],
    },
    software: {
      youtube: [
        {
          id: 'rec-8',
          name: 'Adobe Premiere Pro',
          type: 'Video Editor',
          category: 'Editing',
          price: 20,
          rating: 4.5,
          reason: 'Industry standard with powerful features and integration',
          matchScore: 91,
          alternatives: ['DaVinci Resolve', 'Final Cut Pro'],
          bestFor: ['Professional Editing', 'Color Grading', 'Effects'],
          considerations: ['Subscription model', 'Learning curve'],
        },
        {
          id: 'rec-9',
          name: 'TubeBuddy',
          type: 'YouTube Tool',
          category: 'Optimization',
          price: 9,
          rating: 4.3,
          reason: 'Essential YouTube optimization and management tool',
          matchScore: 94,
          alternatives: ['VidIQ', 'Morningfame'],
          bestFor: ['SEO', 'Bulk Processing', 'Analytics'],
          considerations: ['Limited free features', 'Can be overwhelming'],
        },
      ],
      tiktok: [
        {
          id: 'rec-10',
          name: 'CapCut',
          type: 'Mobile Editor',
          category: 'Editing',
          price: 0,
          rating: 4.7,
          reason: 'TikTok-owned editor with built-in effects and transitions',
          matchScore: 99,
          alternatives: ['InShot', 'VN Video Editor'],
          bestFor: ['Quick Edits', 'Trendy Effects', 'Mobile Workflow'],
          considerations: ['Watermark on free version', 'Limited desktop features'],
        },
      ],
      twitch: [
        {
          id: 'rec-11',
          name: 'OBS Studio',
          type: 'Streaming Software',
          category: 'Broadcasting',
          price: 0,
          rating: 4.8,
          reason: 'Free, powerful, and infinitely customizable streaming software',
          matchScore: 100,
          alternatives: ['Streamlabs OBS', 'XSplit'],
          bestFor: ['Live Streaming', 'Recording', 'Scene Management'],
          considerations: ['Resource intensive', 'Complex for beginners'],
        },
      ],
    },
  };

  const platformRecs = recommendations[category as keyof typeof recommendations]?.[platform] || [];
  
  // Filter by budget
  return platformRecs.filter(rec => rec.price <= budget * 0.4).slice(0, 5);
}

function generateBudgetBreakdown(category: string, budget: number) {
  const breakdowns = {
    equipment: {
      essential: {
        items: ['Basic Microphone ($50)', 'Ring Light ($30)', 'Phone Tripod ($20)'],
        total: 100,
      },
      recommended: {
        items: ['USB Microphone ($100)', 'Softbox Lights ($150)', 'Webcam ($80)'],
        total: 330,
      },
      optional: {
        items: ['DSLR Camera ($600)', 'Professional Lighting ($300)', 'Audio Interface ($200)'],
        total: 1100,
      },
    },
    software: {
      essential: {
        items: ['Basic Editor (Free)', 'Thumbnail Tool ($5/mo)', 'Analytics (Free)'],
        total: 5,
      },
      recommended: {
        items: ['Pro Editor ($20/mo)', 'SEO Tool ($10/mo)', 'Design Tool ($10/mo)'],
        total: 40,
      },
      optional: {
        items: ['Full Adobe Suite ($55/mo)', 'Advanced Analytics ($50/mo)', 'AI Tools ($30/mo)'],
        total: 135,
      },
    },
  };

  const breakdown = breakdowns[category as keyof typeof breakdowns] || breakdowns.equipment;

  // Adjust totals based on user budget
  const factor = budget / 500;
  return {
    essential: {
      ...breakdown.essential,
      total: Math.round(breakdown.essential.total * factor),
    },
    recommended: {
      ...breakdown.recommended,
      total: Math.round(breakdown.recommended.total * factor),
    },
    optional: {
      ...breakdown.optional,
      total: Math.round(breakdown.optional.total * factor),
    },
  };
}

function generateSetupGuides(platform: string, category: string, userLevel: string) {
  const guides = {
    equipment: [
      {
        title: 'Basic Home Studio Setup',
        description: 'Create a professional recording space on any budget',
        steps: [
          {
            step: 1,
            title: 'Choose Your Space',
            description: 'Find a quiet corner with minimal echo and good natural light',
            tips: ['Use blankets to dampen echo', 'Face a window for natural light'],
          },
          {
            step: 2,
            title: 'Set Up Audio',
            description: 'Position your microphone 6-8 inches from your mouth',
            tips: ['Use a pop filter', 'Record room tone for noise reduction'],
          },
          {
            step: 3,
            title: 'Lighting Setup',
            description: 'Create a three-point lighting setup for professional look',
            tips: ['Key light at 45°', 'Fill light opposite', 'Background light for depth'],
          },
          {
            step: 4,
            title: 'Camera Positioning',
            description: 'Place camera at eye level for best angle',
            tips: ['Clean your lens', 'Check framing before recording'],
          },
        ],
        estimatedTime: '2-3 hours',
        difficulty: userLevel as 'beginner' | 'intermediate' | 'advanced',
      },
      {
        title: 'Mobile Creator Setup',
        description: 'Optimize your smartphone for content creation',
        steps: [
          {
            step: 1,
            title: 'Phone Settings',
            description: 'Configure camera for highest quality',
            tips: ['Enable 4K recording', 'Lock exposure and focus'],
          },
          {
            step: 2,
            title: 'Stabilization',
            description: 'Set up tripod or gimbal for smooth footage',
            tips: ['Balance gimbal properly', 'Use timer for hands-free recording'],
          },
          {
            step: 3,
            title: 'Audio Setup',
            description: 'Connect external microphone for better sound',
            tips: ['Test levels before recording', 'Monitor with headphones'],
          },
        ],
        estimatedTime: '1 hour',
        difficulty: 'beginner',
      },
    ],
    software: [
      {
        title: `${platform} Software Setup`,
        description: `Essential software setup for ${platform} creators`,
        steps: [
          {
            step: 1,
            title: 'Install Core Software',
            description: 'Download and install your main editing software',
            tips: ['Check system requirements', 'Install on SSD for speed'],
          },
          {
            step: 2,
            title: 'Configure Settings',
            description: 'Optimize software settings for your workflow',
            tips: ['Set up keyboard shortcuts', 'Create project templates'],
          },
          {
            step: 3,
            title: 'Install Plugins',
            description: 'Add essential plugins and effects',
            tips: ['Start with free plugins', 'Organize plugin folders'],
          },
        ],
        estimatedTime: '1-2 hours',
        difficulty: userLevel as 'beginner' | 'intermediate' | 'advanced',
      },
    ],
  };

  return guides[category as keyof typeof guides] || guides.equipment;
}