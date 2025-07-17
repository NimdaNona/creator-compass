'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, Loader2, X, Minimize2, Maximize2, HelpCircle, 
  Lightbulb, TrendingUp, Target, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  prompt: string;
  category: 'help' | 'idea' | 'analyze' | 'optimize';
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Get Content Ideas",
    icon: <Lightbulb className="h-4 w-4" />,
    prompt: "Give me content ideas for my platform",
    category: "idea"
  },
  {
    label: "Analyze Performance",
    icon: <TrendingUp className="h-4 w-4" />,
    prompt: "Analyze my current performance and suggest improvements",
    category: "analyze"
  },
  {
    label: "Next Steps",
    icon: <Target className="h-4 w-4" />,
    prompt: "What should I focus on next in my roadmap?",
    category: "help"
  },
  {
    label: "Optimize Strategy",
    icon: <Sparkles className="h-4 w-4" />,
    prompt: "How can I optimize my content strategy?",
    category: "optimize"
  },
];

interface AIAssistantWidgetProps {
  className?: string;
  defaultMinimized?: boolean;
  context?: {
    page?: string;
    feature?: string;
    userLevel?: string;
    platform?: string;
  };
}

export function AIAssistantWidget({ 
  className, 
  defaultMinimized = true,
  context 
}: AIAssistantWidgetProps) {
  const [isMinimized, setIsMinimized] = useState(defaultMinimized);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your AI assistant. I can help you with content ideas, strategy tips, and answer any questions about Creator Compass. What would you like help with?",
      timestamp: new Date(),
      suggestions: ["Content ideas", "Growth tips", "Platform help", "Roadmap guidance"]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isMinimized) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      inputRef.current?.focus();
    }
  }, [messages, isMinimized]);

  const sendMessage = async (messageContent?: string) => {
    const messageToSend = messageContent || input;
    if (!messageToSend.trim()) return;

    setInput('');
    
    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: messageToSend,
          context: {
            type: 'support',
            page: context?.page || window.location.pathname,
            feature: context?.feature,
            userLevel: context?.userLevel,
            platform: context?.platform,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let assistantMessage = '';

      // Add empty assistant message
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
                
                // Update the last assistant message
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  
                  if (lastMessage?.role === 'assistant') {
                    lastMessage.content = assistantMessage;
                  }
                  
                  return newMessages;
                });
              }

              if (data.conversationId && !conversationId) {
                setConversationId(data.conversationId);
              }

              if (data.done) {
                // Add contextual suggestions
                const suggestions = generateSuggestions(assistantMessage, context);
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage?.role === 'assistant') {
                    lastMessage.suggestions = suggestions;
                  }
                  return newMessages;
                });
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

  const generateSuggestions = (response: string, ctx?: any): string[] => {
    const suggestions: string[] = [];
    
    // Context-based suggestions
    if (ctx?.page?.includes('dashboard')) {
      suggestions.push("Show my progress", "What should I work on today?");
    } else if (ctx?.page?.includes('templates')) {
      suggestions.push("Help me create content", "Best practices for my niche");
    } else if (ctx?.page?.includes('resources')) {
      suggestions.push("Recommend resources", "Learning path");
    }

    // Response-based suggestions
    if (response.toLowerCase().includes('content')) {
      suggestions.push("More content ideas", "Content calendar");
    }
    if (response.toLowerCase().includes('growth') || response.toLowerCase().includes('audience')) {
      suggestions.push("Growth strategies", "Engagement tips");
    }

    return suggestions.slice(0, 4);
  };

  const handleQuickAction = (action: QuickAction) => {
    sendMessage(action.prompt);
  };

  const handleSuggestion = (suggestion: string) => {
    sendMessage(suggestion);
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
              className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-shadow"
            >
              <Bot className="h-6 w-6" />
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
            <Card className="w-96 h-[600px] flex flex-col shadow-2xl">
              {/* Header */}
              <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-purple-500" />
                    <h3 className="font-semibold">AI Assistant</h3>
                    <Badge variant="secondary" className="text-xs">
                      Beta
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setIsMinimized(true)}
                    >
                      <Minimize2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div key={index}>
                      <div
                        className={cn(
                          "flex",
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[85%] rounded-lg p-3",
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      
                      {/* Suggestions */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {message.suggestions.map((suggestion, idx) => (
                            <Button
                              key={idx}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => handleSuggestion(suggestion)}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      )}
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

              {/* Quick Actions */}
              {messages.length === 1 && (
                <div className="px-4 pb-2">
                  <p className="text-xs text-muted-foreground mb-2">Quick actions:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_ACTIONS.map((action, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        className="justify-start text-xs"
                        onClick={() => handleQuickAction(action)}
                      >
                        {action.icon}
                        <span className="ml-1">{action.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
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
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  AI responses may be inaccurate. Always verify important information.
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}