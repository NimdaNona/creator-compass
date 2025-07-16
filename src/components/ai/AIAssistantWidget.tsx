'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  X, 
  Send, 
  Minimize2, 
  Maximize2,
  Bot,
  User,
  Loader2,
  HelpCircle,
  TrendingUp,
  Lightbulb,
  FileText,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface QuickAction {
  id: string;
  label: string;
  query: string;
  icon: any;
}

const quickActions: QuickAction[] = [
  {
    id: 'help',
    label: 'How to grow on YouTube?',
    query: 'What are the best strategies to grow my YouTube channel?',
    icon: TrendingUp,
  },
  {
    id: 'ideas',
    label: 'Content ideas',
    query: 'Give me some trending content ideas for my niche',
    icon: Lightbulb,
  },
  {
    id: 'roadmap',
    label: 'Explain my roadmap',
    query: 'Can you explain my current roadmap and what I should focus on?',
    icon: FileText,
  },
  {
    id: 'general',
    label: 'General help',
    query: 'What can you help me with?',
    icon: HelpCircle,
  },
];

export function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const handleQuickAction = (action: QuickAction) => {
    setInput(action.query);
    handleSendMessage(action.query);
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamingMessage('');

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: textToSend,
          includeKnowledge: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

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
                
                if (data.type === 'start' && !conversationId) {
                  setConversationId(data.conversationId);
                } else if (data.type === 'content') {
                  accumulatedContent += data.content;
                  setStreamingMessage(accumulatedContent);
                } else if (data.type === 'complete') {
                  const assistantMessage: Message = {
                    id: `msg_${Date.now()}`,
                    role: 'assistant',
                    content: accumulatedContent,
                    timestamp: new Date(),
                  };
                  setMessages(prev => [...prev, assistantMessage]);
                  setStreamingMessage('');
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
      toast.error('Failed to get response. Please try again.');
      
      // Add error message
      const errorMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or refresh the page.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setStreamingMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleWidget = () => {
    if (!isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
    } else if (!isMinimized) {
      setIsMinimized(true);
    } else {
      setIsOpen(false);
      setIsMinimized(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg bg-purple-600 hover:bg-purple-700 text-white"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
            <Badge 
              className="absolute -top-1 -right-1 px-2 py-0.5 text-xs bg-yellow-500 text-black"
              variant="secondary"
            >
              <Sparkles className="h-3 w-3 mr-0.5" />
              AI
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={`fixed z-50 ${
              isMinimized 
                ? 'bottom-20 md:bottom-6 right-4 md:right-6 w-72' 
                : 'bottom-20 md:bottom-6 right-4 md:right-6 w-[calc(100vw-2rem)] md:w-96 h-[600px] max-h-[80vh] max-w-md'
            }`}
          >
            <Card className="h-full flex flex-col shadow-2xl border-2">
              {/* Header */}
              <CardHeader className="flex flex-row items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  <span className="font-semibold">AI Assistant</span>
                  <Badge variant="secondary" className="text-xs">
                    Online
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="h-8 w-8 text-white hover:bg-white/20"
                  >
                    {isMinimized ? (
                      <Maximize2 className="h-4 w-4" />
                    ) : (
                      <Minimize2 className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 text-white hover:bg-white/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              {/* Content */}
              {!isMinimized && (
                <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    {messages.length === 0 ? (
                      <div className="space-y-4">
                        <div className="text-center py-8">
                          <Bot className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                          <h3 className="font-semibold mb-2">Hi! I\'m your AI assistant</h3>
                          <p className="text-sm text-muted-foreground mb-6">
                            I can help you with content ideas, growth strategies, and answer any creator questions.
                          </p>
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground mb-2">Quick actions:</p>
                          {quickActions.map((action) => {
                            const Icon = action.icon;
                            return (
                              <Button
                                key={action.id}
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuickAction(action)}
                                className="w-full justify-start text-left"
                              >
                                <Icon className="h-4 w-4 mr-2" />
                                {action.label}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${
                              message.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            {message.role === 'assistant' && (
                              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <Bot className="h-5 w-5 text-purple-600" />
                              </div>
                            )}
                            <div
                              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                message.role === 'user'
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              <p className={`text-xs mt-1 ${
                                message.role === 'user' ? 'text-purple-200' : 'text-muted-foreground'
                              }`}>
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                            {message.role === 'user' && (
                              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                                <User className="h-5 w-5 text-white" />
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {/* Streaming message */}
                        {streamingMessage && (
                          <div className="flex gap-3 justify-start">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                              <Bot className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                              <p className="text-sm whitespace-pre-wrap">{streamingMessage}</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Loading indicator */}
                        {isLoading && !streamingMessage && (
                          <div className="flex gap-3 justify-start">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                              <Bot className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>

                  {/* Input */}
                  <div className="p-4 border-t">
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
                        onClick={() => handleSendMessage()}
                        disabled={!input.trim() || isLoading}
                        size="icon"
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Powered by AI • Your data is secure
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}