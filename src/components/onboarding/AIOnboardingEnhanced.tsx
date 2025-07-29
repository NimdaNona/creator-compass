'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Send, Loader2, Youtube, Music2, Gamepad2, 
  Camera, Mic, Lightbulb, Monitor, Phone, Clock, Target, 
  TrendingUp, Users, DollarSign, Brain, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getPlatformById, getNicheById } from '@/lib/data';
import { useAppStore } from '@/store/useAppStore';
import type { UserProgress } from '@/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface QuickOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
  description?: string;
}

interface AIOnboardingEnhancedProps {
  onComplete: () => void;
  selectedPlatform: string;
  setSelectedPlatform: (platform: string) => void;
  selectedNiche: string;
  setSelectedNiche: (niche: string) => void;
}

const CREATOR_LEVELS: QuickOption[] = [
  { 
    label: "Just Starting Out", 
    value: "1", 
    icon: <Sparkles className="h-4 w-4" />,
    description: "I'm brand new to content creation" 
  },
  { 
    label: "Some Experience", 
    value: "2", 
    icon: <TrendingUp className="h-4 w-4" />,
    description: "I've created content but want to grow" 
  },
  { 
    label: "Experienced Creator", 
    value: "3", 
    icon: <Brain className="h-4 w-4" />,
    description: "I want to optimize and scale" 
  },
];

const PLATFORMS: QuickOption[] = [
  { label: "YouTube", value: "youtube", icon: <Youtube className="h-5 w-5" /> },
  { label: "TikTok", value: "tiktok", icon: <Music2 className="h-5 w-5" /> },
  { label: "Twitch", value: "twitch", icon: <Gamepad2 className="h-5 w-5" /> },
];

const CONTENT_NICHES: QuickOption[] = [
  { label: "Gaming", value: "gaming", icon: <Gamepad2 className="h-4 w-4" /> },
  { label: "Education", value: "education", icon: <Brain className="h-4 w-4" /> },
  { label: "Lifestyle", value: "lifestyle", icon: <Camera className="h-4 w-4" /> },
  { label: "Comedy", value: "comedy", icon: <Music2 className="h-4 w-4" /> },
  { label: "Tech", value: "tech", icon: <Monitor className="h-4 w-4" /> },
  { label: "Other", value: "other", icon: <Sparkles className="h-4 w-4" /> },
];

const EQUIPMENT_OPTIONS: QuickOption[] = [
  { label: "Just my phone", value: "phone", icon: <Phone className="h-4 w-4" /> },
  { label: "Basic camera", value: "camera", icon: <Camera className="h-4 w-4" /> },
  { label: "Microphone", value: "mic", icon: <Mic className="h-4 w-4" /> },
  { label: "Lighting", value: "lighting", icon: <Lightbulb className="h-4 w-4" /> },
  { label: "Computer/Laptop", value: "computer", icon: <Monitor className="h-4 w-4" /> },
];

const TIME_COMMITMENTS: QuickOption[] = [
  { label: "< 5 hours/week", value: "5", icon: <Clock className="h-4 w-4" /> },
  { label: "5-10 hours/week", value: "10", icon: <Clock className="h-4 w-4" /> },
  { label: "10-20 hours/week", value: "20", icon: <Clock className="h-4 w-4" /> },
  { label: "20-30 hours/week", value: "30", icon: <Clock className="h-4 w-4" /> },
  { label: "30+ hours/week", value: "40", icon: <Clock className="h-4 w-4" /> },
];

const GOALS: QuickOption[] = [
  { label: "Build an audience", value: "audience", icon: <Users className="h-4 w-4" /> },
  { label: "Monetize content", value: "monetize", icon: <DollarSign className="h-4 w-4" /> },
  { label: "Improve quality", value: "quality", icon: <TrendingUp className="h-4 w-4" /> },
  { label: "Go full-time", value: "fulltime", icon: <Target className="h-4 w-4" /> },
];

const CHALLENGES: QuickOption[] = [
  { label: "Getting viewers", value: "viewers", icon: <Users className="h-4 w-4" /> },
  { label: "Content ideas", value: "ideas", icon: <Brain className="h-4 w-4" /> },
  { label: "Technical setup", value: "technical", icon: <Monitor className="h-4 w-4" /> },
  { label: "Time management", value: "time", icon: <Clock className="h-4 w-4" /> },
  { label: "Standing out", value: "unique", icon: <Sparkles className="h-4 w-4" /> },
];

export function AIOnboardingEnhanced({
  onComplete,
  selectedPlatform,
  setSelectedPlatform,
  selectedNiche,
  setSelectedNiche,
}: AIOnboardingEnhancedProps) {
  const { setProgress, setOnboardingComplete } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Welcome to Creator Compass! 🎉 I'm here to help create your personalized 90-day roadmap. Let's start with your experience level:",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('welcome');
  const [quickOptions, setQuickOptions] = useState<QuickOption[]>(CREATOR_LEVELS);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  
  // Store all responses collected during onboarding
  const [collectedResponses, setCollectedResponses] = useState<Record<string, any>>({});
  
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const updateQuickOptions = (step: string) => {
    switch (step) {
      case 'welcome':
        setQuickOptions(CREATOR_LEVELS);
        break;
      case 'platform':
        setQuickOptions(PLATFORMS);
        break;
      case 'niche':
        setQuickOptions(CONTENT_NICHES);
        break;
      case 'equipment':
        setQuickOptions(EQUIPMENT_OPTIONS);
        break;
      case 'goals':
        setQuickOptions(GOALS);
        break;
      case 'time':
        setQuickOptions(TIME_COMMITMENTS);
        break;
      case 'challenges':
        setQuickOptions(CHALLENGES);
        break;
      default:
        setQuickOptions([]);
    }
  };

  const saveOnboardingData = async () => {
    try {
      const response = await fetch('/api/ai/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          responses: collectedResponses,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Onboarding] Save error:', errorData);
        throw new Error(errorData.error || 'Failed to save onboarding data');
      }

      const result = await response.json();
      console.log('[Onboarding] Data saved successfully:', result);
      
      // Ensure platform and niche are set via the parent component's handlers
      // The parent component expects string IDs and converts them to objects
      if (selectedPlatform) {
        setSelectedPlatform(selectedPlatform); // This calls the parent's handler which converts to object
      }
      
      if (selectedNiche) {
        setSelectedNiche(selectedNiche); // This calls the parent's handler which converts to object
      }

      // Create initial progress object
      if (selectedPlatform && selectedNiche) {
        
        const initialProgress: UserProgress = {
          userId: result.userId || 'guest',
          selectedPlatform: selectedPlatform, // Keep as string ID for UserProgress
          selectedNiche: selectedNiche,       // Keep as string ID for UserProgress
          currentPhase: 1,
          currentWeek: 1,
          startDate: new Date(),
          completedTasks: [],
          streakDays: 0,
          totalPoints: 0,
          achievements: [],
          lastUpdated: new Date()
        };
        
        setProgress(initialProgress);
        setOnboardingComplete(true);
      }
      
      toast({
        title: "Onboarding Complete",
        description: "Your creator profile has been saved successfully!",
        variant: "default",
      });

      // Navigate to dashboard after a short delay
      setTimeout(() => {
        onComplete();
      }, 1000);
    } catch (error) {
      console.error('[Onboarding] Failed to save data:', error);
      toast({
        title: "Save Error",
        description: "Failed to save your onboarding data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async (messageContent?: string) => {
    const messageToSend = messageContent || input;
    if (!messageToSend.trim() && !messageContent) return;

    setInput('');
    setError(null);
    
    // Add user message
    setMessages(prev => [...prev, {
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
    }]);

    setIsLoading(true);

    try {
      // Build responses object with all collected data
      const responses: any = { ...collectedResponses };
      
      // Update responses based on current step
      if (currentStep === 'welcome') {
        if (messageToSend.toLowerCase().includes('starting') || messageToSend.includes('1')) {
          responses.creatorLevel = 'beginner';
        } else if (messageToSend.toLowerCase().includes('some') || messageToSend.includes('2')) {
          responses.creatorLevel = 'intermediate';
        } else if (messageToSend.toLowerCase().includes('experienced') || messageToSend.includes('3')) {
          responses.creatorLevel = 'advanced';
        }
      }
      
      if (selectedPlatform) {
        responses.preferredPlatforms = [selectedPlatform];
      }
      if (selectedNiche) {
        responses.contentNiche = selectedNiche;
      }
      if (selectedEquipment.length > 0) {
        responses.equipment = selectedEquipment;
      }
      if (selectedGoals.length > 0) {
        responses.goals = selectedGoals;
      }

      // Update collected responses state
      setCollectedResponses(responses);

      const requestBody: any = {
        message: messageToSend,
        context: {
          type: 'onboarding',
          step: currentStep,
          responses: responses,
        },
      };

      // Only include conversationId if it's not null
      if (conversationId) {
        requestBody.conversationId = conversationId;
      }

      console.log('[Onboarding] Sending request:', {
        conversationId,
        currentStep,
        message: messageToSend,
        responses,
      });

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Onboarding] API Error:', errorData);
        throw new Error(errorData.error || 'Failed to send message');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let assistantMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.content) {
                assistantMessage += data.content;
                
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  
                  if (lastMessage?.role === 'assistant') {
                    lastMessage.content = assistantMessage;
                  } else {
                    newMessages.push({
                      role: 'assistant',
                      content: assistantMessage,
                      timestamp: new Date(),
                    });
                  }
                  
                  return newMessages;
                });
              }

              if (data.conversationId && !conversationId) {
                setConversationId(data.conversationId);
                console.log('[Onboarding] Conversation ID set:', data.conversationId);
              }

              if (data.error) {
                console.error('[Onboarding] Chat error:', data.error);
                setError(data.message || 'An error occurred');
                if (data.timeout) {
                  // Auto-retry on timeout
                  toast({
                    title: "Response Timeout",
                    description: "The AI took too long to respond. Retrying...",
                    variant: "default",
                  });
                  setTimeout(() => {
                    setError(null);
                    sendMessage(messageToSend);
                  }, 2000);
                }
                return;
              }

              if (data.done) {
                console.log('[Onboarding] Response complete:', {
                  hasContent: data.hasContent,
                  assistantMessage: assistantMessage,
                  conversationId: data.conversationId,
                });
                
                if (!data.hasContent && !assistantMessage) {
                  // No content received - likely an error
                  setError('No response received. Please try again.');
                  return;
                }
              }

              // Update step based on AI response
              if (assistantMessage.toLowerCase().includes('platform') && !assistantMessage.toLowerCase().includes('which platform')) {
                setCurrentStep('platform');
                updateQuickOptions('platform');
              } else if (assistantMessage.toLowerCase().includes('content') && assistantMessage.toLowerCase().includes('type')) {
                setCurrentStep('niche');
                updateQuickOptions('niche');
              } else if (assistantMessage.toLowerCase().includes('equipment')) {
                setCurrentStep('equipment');
                updateQuickOptions('equipment');
              } else if (assistantMessage.toLowerCase().includes('goals') && !assistantMessage.toLowerCase().includes('time')) {
                setCurrentStep('goals');
                updateQuickOptions('goals');
              } else if (assistantMessage.toLowerCase().includes('time') && assistantMessage.toLowerCase().includes('dedicate')) {
                setCurrentStep('time');
                updateQuickOptions('time');
              } else if (assistantMessage.toLowerCase().includes('challenges') || assistantMessage.toLowerCase().includes('concerns')) {
                setCurrentStep('challenges');
                updateQuickOptions('challenges');
              } else if (assistantMessage.toLowerCase().includes('roadmap is ready') || 
                        assistantMessage.toLowerCase().includes('everything i need') ||
                        assistantMessage.toLowerCase().includes('start my creator journey')) {
                setCurrentStep('complete');
                setQuickOptions([]);
                // Ensure isLoading is set to false so the button appears
                setIsLoading(false);
                
                // Save onboarding data to database
                saveOnboardingData();
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('[Onboarding] Chat error:', error);
      setError('Failed to send message. Please try again.');
      
      // Provide a fallback response for critical onboarding steps
      if (currentStep === 'welcome' && !conversationId) {
        // Fallback for first message failure
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "I apologize for the technical issue. Let me help you get started! Are you just starting out (1), have some experience (2), or are you an experienced creator (3)?",
          timestamp: new Date(),
        }]);
        toast({
          title: "Connection Issue",
          description: "Using fallback mode. Your progress will be saved.",
          variant: "default",
        });
      } else {
        toast({
          title: "Connection Error",
          description: "Failed to connect to the AI assistant. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleQuickOption = (option: QuickOption) => {
    if (currentStep === 'equipment') {
      const newEquipment = selectedEquipment.includes(option.value)
        ? selectedEquipment.filter(e => e !== option.value)
        : [...selectedEquipment, option.value];
      setSelectedEquipment(newEquipment);
      return;
    }

    if (currentStep === 'goals') {
      const newGoals = selectedGoals.includes(option.value)
        ? selectedGoals.filter(g => g !== option.value)
        : [...selectedGoals, option.value];
      setSelectedGoals(newGoals);
      return;
    }

    // For single-select options
    if (currentStep === 'platform') {
      setSelectedPlatform(option.value);
    } else if (currentStep === 'niche') {
      setSelectedNiche(option.value);
    }

    sendMessage(option.label);
  };

  const handleEquipmentSubmit = () => {
    const equipmentText = selectedEquipment.length > 0
      ? `I have: ${selectedEquipment.join(', ')}`
      : "I don't have any equipment yet";
    sendMessage(equipmentText);
  };

  const handleGoalsSubmit = () => {
    const goalsText = selectedGoals.length > 0
      ? `My goals are: ${selectedGoals.join(', ')}`
      : "I'm still figuring out my goals";
    sendMessage(goalsText);
  };

  const isComplete = currentStep === 'complete';

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <div className="flex flex-col h-[700px]">
        <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <h2 className="text-lg font-semibold">AI Onboarding Assistant</h2>
            </div>
            <Badge variant="outline" className="text-xs">
              Step {currentStep === 'welcome' ? '1' : currentStep === 'platform' ? '2' : 
                    currentStep === 'niche' ? '3' : currentStep === 'equipment' ? '4' : 
                    currentStep === 'goals' ? '5' : currentStep === 'time' ? '6' : 
                    currentStep === 'challenges' ? '7' : '8'} of 8
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Let's create your personalized creator roadmap together
          </p>
        </div>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg p-4",
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Options */}
        {quickOptions.length > 0 && !isLoading && !isComplete && (
          <div className="px-4 pb-2">
            <p className="text-xs text-muted-foreground mb-2">Quick options:</p>
            <div className="flex flex-wrap gap-2">
              {quickOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={
                    (currentStep === 'equipment' && selectedEquipment.includes(option.value)) ||
                    (currentStep === 'goals' && selectedGoals.includes(option.value))
                      ? 'default'
                      : 'outline'
                  }
                  size="sm"
                  onClick={() => handleQuickOption(option)}
                  className="flex items-center gap-2"
                >
                  {option.icon}
                  {option.label}
                </Button>
              ))}
              {(currentStep === 'equipment' || currentStep === 'goals') && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={currentStep === 'equipment' ? handleEquipmentSubmit : handleGoalsSubmit}
                  className="ml-auto"
                >
                  Continue →
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="p-4 border-t">
          {error && (
            <div className="mb-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          {!isComplete ? (
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type your answer or use quick options above..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          ) : (
            <Button
              onClick={onComplete}
              className="w-full"
              size="lg"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Start My Creator Journey
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}