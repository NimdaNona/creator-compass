'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Bot, Send, Loader2, Minimize2, Brain, Heart, Target, 
  History, Settings, ChevronRight, Sparkles, User,
  MessageSquare, TrendingUp, Lightbulb, Calendar,
  Clock, Star, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FeatureUsageIndicator } from '@/components/usage/FeatureUsageIndicator';
import { useSubscription } from '@/hooks/useSubscription';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    emotion?: string;
    confidence?: number;
    helpfulness?: number;
  };
}

interface ConversationSummary {
  id: string;
  summary: string;
  lastActive: Date;
  topicTags: string[];
}

interface PersonalityProfile {
  type: string;
  traits: string[];
  adaptations: {
    preferredGreeting: string;
    responseLength: string;
    proactivity: string;
  };
}

export function PersistentAIAssistant({ 
  className, 
  defaultMinimized = true,
  context 
}: {
  className?: string;
  defaultMinimized?: boolean;
  context?: Record<string, any>;
}) {
  const [isMinimized, setIsMinimized] = useState(defaultMinimized);
  const [activeTab, setActiveTab] = useState('chat');
  const { data: session } = useSession();
  const { subscription, isActive } = useSubscription();
  const isFreeTier = !isActive || subscription?.plan === 'free';
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [recentConversations, setRecentConversations] = useState<ConversationSummary[]>([]);
  const [personalityProfile, setPersonalityProfile] = useState<PersonalityProfile | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize AI assistant with personality
  useEffect(() => {
    if (!isMinimized && session?.user?.id && !isInitialized) {
      initializeAssistant();
    }
  }, [isMinimized, session?.user?.id, isInitialized]);

  const initializeAssistant = async () => {
    try {
      // Load personality profile and recent conversations
      const [profileRes, conversationsRes] = await Promise.all([
        fetch('/api/ai/personality'),
        fetch('/api/ai/conversations/recent')
      ]);

      if (profileRes.ok) {
        const profile = await profileRes.json();
        setPersonalityProfile(profile);
      }

      if (conversationsRes.ok) {
        const conversations = await conversationsRes.json();
        setRecentConversations(conversations);
      }

      // Create personalized greeting
      const greeting = await generatePersonalizedGreeting();
      setMessages([{
        role: 'assistant',
        content: greeting,
        timestamp: new Date()
      }]);

      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize AI assistant:', error);
      // Fallback greeting
      setMessages([{
        role: 'assistant',
        content: "Hello! I'm here to help you on your creator journey. What would you like to work on today?",
        timestamp: new Date()
      }]);
    }
  };

  const generatePersonalizedGreeting = async () => {
    try {
      const response = await fetch('/api/ai/greeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context })
      });

      if (response.ok) {
        const { greeting } = await response.json();
        return greeting;
      }
    } catch (error) {
      console.error('Failed to generate personalized greeting:', error);
    }

    return "Welcome back! I'm ready to help you grow your creator journey. What's on your mind today?";
  };

  const sendMessage = async (messageContent?: string) => {
    const messageToSend = messageContent || input;
    if (!messageToSend.trim()) return;

    setInput('');
    
    const userMessage: Message = {
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat-persistent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: messageToSend,
          context,
          includeMemory: true,
          adaptPersonality: true
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        
        if (error.requiresUpgrade) {
          handleUpgradePrompt(error);
          return;
        }
        
        throw new Error(error.error || 'Failed to send message');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let assistantMessage = '';
      let messageMetadata: any = {};

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }]);

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
                    if (data.metadata) {
                      lastMessage.metadata = data.metadata;
                    }
                  }
                  
                  return newMessages;
                });
              }

              if (data.conversationId && !conversationId) {
                setConversationId(data.conversationId);
              }

              if (data.personalityUpdate) {
                setPersonalityProfile(data.personalityUpdate);
              }

              if (data.done) {
                // Track interaction for learning
                trackInteraction(messageToSend, assistantMessage, data.metadata);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to the AI assistant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const trackInteraction = async (userMessage: string, assistantResponse: string, metadata: any) => {
    try {
      await fetch('/api/ai/track-interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          userMessage,
          assistantResponse,
          metadata,
          context
        })
      });
    } catch (error) {
      console.error('Failed to track interaction:', error);
    }
  };

  const handleUpgradePrompt = (error: any) => {
    toast({
      title: "AI Message Limit Reached",
      description: error.error || 'You have reached your monthly AI message limit',
      variant: "destructive",
      action: {
        label: "Upgrade",
        onClick: () => window.location.href = '/pricing'
      }
    });
    
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: "I'd love to continue helping you, but you've reached your monthly AI message limit. Upgrade to Pro for unlimited AI assistance and unlock advanced features! 🚀",
      timestamp: new Date(),
    }]);
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/ai/conversations/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setConversationId(conversationId);
        setActiveTab('chat');
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation history",
        variant: "destructive"
      });
    }
  };

  const renderPersonalityBadge = () => {
    if (!personalityProfile) return null;

    const personalities = {
      guide: { icon: <Lightbulb className="h-3 w-3" />, color: 'bg-blue-500' },
      coach: { icon: <Target className="h-3 w-3" />, color: 'bg-green-500' },
      cheerleader: { icon: <Heart className="h-3 w-3" />, color: 'bg-pink-500' },
      analyst: { icon: <TrendingUp className="h-3 w-3" />, color: 'bg-purple-500' },
      mentor: { icon: <Brain className="h-3 w-3" />, color: 'bg-indigo-500' }
    };

    const personality = personalities[personalityProfile.type as keyof typeof personalities];
    if (!personality) return null;

    return (
      <div className="flex items-center gap-1">
        <div className={cn("p-1 rounded-full text-white", personality.color)}>
          {personality.icon}
        </div>
        <span className="text-xs capitalize">{personalityProfile.type}</span>
      </div>
    );
  };

  const renderQuickActions = () => {
    const actions = [
      { label: "What's Next?", icon: <ChevronRight className="h-4 w-4" />, prompt: "What should I focus on next?" },
      { label: "Content Ideas", icon: <Lightbulb className="h-4 w-4" />, prompt: "Give me content ideas for this week" },
      { label: "Review Progress", icon: <TrendingUp className="h-4 w-4" />, prompt: "Review my progress and achievements" },
      { label: "Get Motivated", icon: <Zap className="h-4 w-4" />, prompt: "I need some motivation today" }
    ];

    return (
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action, idx) => (
          <Button
            key={idx}
            variant="outline"
            size="sm"
            className="justify-start text-xs"
            onClick={() => sendMessage(action.prompt)}
          >
            {action.icon}
            <span className="ml-1">{action.label}</span>
          </Button>
        ))}
      </div>
    );
  };

  return (
    <div className={cn("fixed bottom-4 right-4 z-50", className)}>
      <AnimatePresence>
        {isMinimized ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="relative"
          >
            <Button
              onClick={() => setIsMinimized(false)}
              size="lg"
              className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Bot className="h-6 w-6 text-white" />
            </Button>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Card className="w-[450px] h-[650px] flex flex-col shadow-2xl">
              {/* Enhanced Header */}
              <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-purple-500" />
                    <h3 className="font-semibold">AI Assistant</h3>
                    {renderPersonalityBadge()}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsMinimized(true)}
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="chat" className="text-xs">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Chat
                    </TabsTrigger>
                    <TabsTrigger value="history" className="text-xs">
                      <History className="h-3 w-3 mr-1" />
                      History
                    </TabsTrigger>
                    <TabsTrigger value="insights" className="text-xs">
                      <Brain className="h-3 w-3 mr-1" />
                      Insights
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-hidden">
                <TabsContent value="chat" className="h-full m-0">
                  <div className="flex flex-col h-full">
                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                      <div className="space-y-4">
                        {messages.map((message, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <div
                              className={cn(
                                "flex gap-2",
                                message.role === 'user' ? 'justify-end' : 'justify-start'
                              )}
                            >
                              {message.role === 'assistant' && (
                                <div className="p-1.5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                  <Bot className="h-4 w-4" />
                                </div>
                              )}
                              <div
                                className={cn(
                                  "max-w-[80%] rounded-lg p-3",
                                  message.role === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                )}
                              >
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                <p className="text-xs opacity-70 mt-1">
                                  {format(message.timestamp, 'HH:mm')}
                                </p>
                              </div>
                              {message.role === 'user' && (
                                <div className="p-1.5 rounded-full bg-primary text-primary-foreground">
                                  <User className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                        
                        {isLoading && (
                          <div className="flex justify-start gap-2">
                            <div className="p-1.5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                              <Bot className="h-4 w-4" />
                            </div>
                            <div className="bg-muted rounded-lg p-3">
                              <div className="flex gap-1">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>

                    {/* Quick Actions */}
                    {messages.length === 1 && (
                      <div className="px-4 pb-2">
                        <p className="text-xs text-muted-foreground mb-2">Quick actions:</p>
                        {renderQuickActions()}
                      </div>
                    )}

                    {/* Usage Indicator */}
                    {isFreeTier && messages.length > 1 && (
                      <div className="px-4 pb-2">
                        <FeatureUsageIndicator 
                          feature="ai" 
                          compact
                          showButton={false}
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="history" className="h-full m-0 p-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium mb-3">Recent Conversations</h4>
                    {recentConversations.length > 0 ? (
                      recentConversations.map((conv) => (
                        <Button
                          key={conv.id}
                          variant="ghost"
                          className="w-full justify-start text-left p-3 h-auto"
                          onClick={() => loadConversation(conv.id)}
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium line-clamp-1">{conv.summary}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="h-3 w-3" />
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(conv.lastActive), 'MMM d, HH:mm')}
                              </span>
                            </div>
                            <div className="flex gap-1 mt-1">
                              {conv.topicTags.slice(0, 3).map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </Button>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No conversation history yet. Start chatting to build your history!
                      </p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="insights" className="h-full m-0 p-4">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">AI Learning Insights</h4>
                    
                    {personalityProfile && (
                      <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-muted">
                          <p className="text-xs font-medium mb-1">Current AI Mode</p>
                          <p className="text-sm capitalize">{personalityProfile.type}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {personalityProfile.traits.map((trait, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {trait}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-muted">
                          <p className="text-xs font-medium mb-2">Learned Preferences</p>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span>Response Style:</span>
                              <span className="capitalize">{personalityProfile.adaptations.responseLength}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Proactivity:</span>
                              <span className="capitalize">{personalityProfile.adaptations.proactivity}</span>
                            </div>
                          </div>
                        </div>

                        <Button variant="outline" size="sm" className="w-full">
                          <Settings className="h-3 w-3 mr-2" />
                          Customize AI Personality
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
              
              {/* Input Area */}
              <div className="p-4 border-t">
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
                    placeholder="Ask anything..."
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
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}