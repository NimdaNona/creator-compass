'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AIOnboarding({ onComplete }: { onComplete: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { setSelectedPlatform, setSelectedNiche, setOnboardingComplete } = useAppStore();

  useEffect(() => {
    // Start conversation with welcome message
    startConversation();
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startConversation = () => {
    setMessages([
      {
        role: 'assistant',
        content: `👋 Hi! I'm your AI guide at CreatorCompass. I'm here to help you create a personalized roadmap to grow your content creation journey!

Let's start by getting to know you better. Are you:
1. 🌱 Just starting out (complete beginner)
2. 📈 Already creating content but want to grow
3. 🚀 Experienced creator looking to optimize

Just type 1, 2, or 3, or tell me in your own words!`,
        timestamp: new Date(),
      },
    ]);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(conversationId && { conversationId }),
          message: input.trim(),
          includeKnowledge: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      if (reader) {
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
                }

                if (data.done) {
                  // Check if we should analyze profile
                  await checkForProfileCompletion(assistantMessage);
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setError('Failed to send message. Please try again.');
      
      // Add error message to chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please try sending your message again.',
        timestamp: new Date(),
      }]);
      
      // Auto-retry logic for transient errors
      if (retryCount < 3) {
        setRetryCount(prev => prev + 1);
        toast.error('Connection error. Retrying...');
        setTimeout(() => {
          sendMessage();
        }, 1000 * (retryCount + 1));
      } else {
        toast.error('Failed to connect. Please check your internet connection.');
        setRetryCount(0);
      }
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const checkForProfileCompletion = async (lastMessage: string) => {
    // Check if we have enough information to complete onboarding
    const hasCompletionKeywords = [
      'ready to start',
      'let\'s begin',
      'all set',
      'roadmap is ready',
      'personalized plan',
    ].some(keyword => lastMessage.toLowerCase().includes(keyword));

    if (hasCompletionKeywords && messages.length > 6) {
      // Analyze conversation to extract profile
      try {
        const conversationHistory = messages.map(m => m.content);
        const response = await fetch('/api/ai/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: lastMessage,
            conversationHistory,
            updateProfile: true,
          }),
        });

        if (response.ok) {
          const { analysis } = await response.json();
          
          // Update app state
          if (analysis.preferredPlatforms?.[0]) {
            setSelectedPlatform(analysis.preferredPlatforms[0]);
          }
          if (analysis.contentNiche) {
            setSelectedNiche(analysis.contentNiche);
          }

          // Show completion button
          setTimeout(() => {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: '🎉 Perfect! I have everything I need to create your personalized roadmap. Click the button below when you\'re ready to see your custom creator journey!',
              timestamp: new Date(),
            }]);
          }, 1000);
        }
      } catch (error) {
        console.error('Profile analysis error:', error);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isComplete = messages.some(m => 
    m.content.includes('Click the button below when you\'re ready')
  );

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <div className="flex flex-col h-[600px]">
        <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <h2 className="text-lg font-semibold">AI Onboarding Assistant</h2>
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
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
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

        <div className="p-4 border-t">
          {error && (
            <div className="mb-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          {!isComplete ? (
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
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