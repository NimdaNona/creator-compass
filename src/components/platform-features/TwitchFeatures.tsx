'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PaywallBanner } from '@/components/paywall/PaywallBanner';
import { useAppStore } from '@/store/useAppStore';
import {
  Radio,
  Users,
  MessageSquare,
  Settings,
  Zap,
  Calendar,
  BarChart3,
  Monitor,
  Gamepad2,
  Mic,
  Camera,
  Heart,
  Gift,
  Crown,
  Star,
  Clock,
  TrendingUp,
  Target,
  Volume2,
  Video
} from 'lucide-react';

interface StreamOverlay {
  id: string;
  name: string;
  type: 'follower_goal' | 'recent_followers' | 'chat_box' | 'donation_alerts' | 'game_info';
  description: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: {
    backgroundColor?: string;
    textColor?: string;
    fontSize?: number;
    borderRadius?: number;
  };
}

interface ChatCommand {
  command: string;
  response: string;
  cooldown: number;
  permissions: 'everyone' | 'followers' | 'subscribers' | 'moderators';
  description: string;
}

interface StreamSchedule {
  day: string;
  startTime: string;
  endTime: string;
  game: string;
  description: string;
  expectedViewers: number;
}

interface StreamGoal {
  type: 'followers' | 'subscribers' | 'bits' | 'donations';
  current: number;
  target: number;
  deadline: string;
  reward: string;
}

export function TwitchFeatures() {
  const { subscription, selectedNiche } = useAppStore();
  const [activeFeature, setActiveFeature] = useState('overlays');
  
  // Stream Overlays State
  const [overlays, setOverlays] = useState<StreamOverlay[]>([]);
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);
  
  // Chat Commands State
  const [chatCommands, setChatCommands] = useState<ChatCommand[]>([]);
  const [newCommand, setNewCommand] = useState('');
  const [newResponse, setNewResponse] = useState('');
  
  // Stream Schedule State
  const [streamSchedule, setStreamSchedule] = useState<StreamSchedule[]>([]);
  
  // Stream Goals State
  const [streamGoals, setStreamGoals] = useState<StreamGoal[]>([]);

  const isPremium = subscription === 'premium';

  const features = [
    { id: 'overlays', name: 'Stream Overlays', icon: Monitor },
    { id: 'commands', name: 'Chat Commands', icon: MessageSquare },
    { id: 'schedule', name: 'Stream Schedule', icon: Calendar },
    { id: 'goals', name: 'Stream Goals', icon: Target },
    { id: 'analytics', name: 'Analytics', icon: BarChart3 }
  ];

  const generateOverlays = () => {
    const defaultOverlays: StreamOverlay[] = [
      {
        id: '1',
        name: 'Follower Goal',
        type: 'follower_goal',
        description: 'Display current follower count and goal',
        position: { x: 10, y: 10 },
        size: { width: 300, height: 80 },
        style: {
          backgroundColor: '#9146ff',
          textColor: '#ffffff',
          fontSize: 18,
          borderRadius: 8
        }
      },
      {
        id: '2',
        name: 'Recent Followers',
        type: 'recent_followers',
        description: 'Show latest followers with notifications',
        position: { x: 10, y: 100 },
        size: { width: 280, height: 200 },
        style: {
          backgroundColor: '#1f1f23',
          textColor: '#ffffff',
          fontSize: 14,
          borderRadius: 8
        }
      },
      {
        id: '3',
        name: 'Chat Box',
        type: 'chat_box',
        description: 'Interactive chat overlay',
        position: { x: 1300, y: 10 },
        size: { width: 350, height: 600 },
        style: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          textColor: '#ffffff',
          fontSize: 12,
          borderRadius: 8
        }
      },
      {
        id: '4',
        name: 'Donation Alerts',
        type: 'donation_alerts',
        description: 'Animated donation notifications',
        position: { x: 500, y: 50 },
        size: { width: 400, height: 100 },
        style: {
          backgroundColor: '#00ff88',
          textColor: '#000000',
          fontSize: 20,
          borderRadius: 12
        }
      }
    ];
    
    setOverlays(defaultOverlays);
  };

  const generateChatCommands = () => {
    const defaultCommands: ChatCommand[] = [
      {
        command: '!discord',
        response: 'Join our Discord community: https://discord.gg/yourcommunity',
        cooldown: 30,
        permissions: 'everyone',
        description: 'Share Discord invite link'
      },
      {
        command: '!schedule',
        response: 'I stream Monday, Wednesday, Friday at 7PM EST!',
        cooldown: 60,
        permissions: 'everyone',
        description: 'Display streaming schedule'
      },
      {
        command: '!socials',
        response: 'Follow me on Twitter @yourusername and Instagram @yourusername',
        cooldown: 45,
        permissions: 'everyone',
        description: 'Share social media links'
      },
      {
        command: '!game',
        response: 'Currently playing: [Game Name] - Having a blast!',
        cooldown: 20,
        permissions: 'everyone',
        description: 'Show current game information'
      },
      {
        command: '!uptime',
        response: 'Stream has been live for: [uptime]',
        cooldown: 10,
        permissions: 'everyone',
        description: 'Display stream uptime'
      }
    ];
    
    setChatCommands(defaultCommands);
  };

  const generateStreamSchedule = () => {
    const schedule: StreamSchedule[] = [
      {
        day: 'Monday',
        startTime: '7:00 PM',
        endTime: '10:00 PM',
        game: 'Valorant',
        description: 'Ranked grind session',
        expectedViewers: 45
      },
      {
        day: 'Wednesday',
        startTime: '7:00 PM',
        endTime: '10:00 PM',
        game: 'Variety Gaming',
        description: 'Subscriber game suggestions',
        expectedViewers: 38
      },
      {
        day: 'Friday',
        startTime: '8:00 PM',
        endTime: '12:00 AM',
        game: 'Just Chatting',
        description: 'Community hangout & Q&A',
        expectedViewers: 52
      },
      {
        day: 'Saturday',
        startTime: '2:00 PM',
        endTime: '6:00 PM',
        game: 'New Game Release',
        description: 'First playthrough',
        expectedViewers: 65
      }
    ];
    
    setStreamSchedule(schedule);
  };

  const generateStreamGoals = () => {
    const goals: StreamGoal[] = [
      {
        type: 'followers',
        current: 847,
        target: 1000,
        deadline: '2024-03-01',
        reward: '24-hour stream marathon'
      },
      {
        type: 'subscribers',
        current: 23,
        target: 50,
        deadline: '2024-02-15',
        reward: 'Face reveal'
      },
      {
        type: 'bits',
        current: 15420,
        target: 25000,
        deadline: '2024-02-28',
        reward: 'Upgrade streaming setup'
      }
    ];
    
    setStreamGoals(goals);
  };

  const renderOverlayDesigner = () => (
    <div className="space-y-6">
      {!isPremium && (
        <PaywallBanner
          feature="Professional Overlay Designer"
          title="Custom Stream Overlays"
          description="Create professional overlays with drag-and-drop designer and real-time preview"
          variant="compact"
        />
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overlay Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Monitor className="w-5 h-5" />
              <span>Stream Preview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg relative overflow-hidden border-2">
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="text-white text-center">
                  <Video className="w-16 h-16 mx-auto mb-2 opacity-50" />
                  <p className="text-sm opacity-75">Stream Content Area</p>
                </div>
              </div>
              
              {/* Overlay Elements Preview */}
              {overlays.slice(0, 2).map((overlay, index) => (
                <div
                  key={overlay.id}
                  className="absolute bg-purple-500/90 text-white p-2 rounded text-xs"
                  style={{
                    left: `${overlay.position.x / 19.2}%`,
                    top: `${overlay.position.y / 10.8}%`,
                    width: `${overlay.size.width / 19.2}%`,
                    height: `${overlay.size.height / 10.8}%`
                  }}
                >
                  {overlay.name}
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex space-x-2">
              <Button onClick={generateOverlays} variant="outline" size="sm" className="flex-1">
                <Zap className="w-3 h-3 mr-1" />
                Generate
              </Button>
              <Button disabled={!isPremium} variant="outline" size="sm">
                <Settings className="w-3 h-3 mr-1" />
                Customize
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Overlay Elements */}
        <Card>
          <CardHeader>
            <CardTitle>Overlay Elements</CardTitle>
          </CardHeader>
          <CardContent>
            {overlays.length > 0 ? (
              <div className="space-y-3">
                {overlays.map((overlay) => (
                  <div
                    key={overlay.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedOverlay === overlay.id 
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
                        : 'border-muted bg-muted/50'
                    }`}
                    onClick={() => setSelectedOverlay(overlay.id)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm">{overlay.name}</h4>
                      <Button variant="ghost" size="sm" disabled={!isPremium}>
                        <Settings className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">{overlay.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Monitor className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Generate overlays to customize your stream
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderChatCommands = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add New Command */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Add Chat Command</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="command">Command</Label>
              <Input
                id="command"
                value={newCommand}
                onChange={(e) => setNewCommand(e.target.value)}
                placeholder="!mycommand"
              />
            </div>
            
            <div>
              <Label htmlFor="response">Response</Label>
              <Textarea
                id="response"
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
                placeholder="Enter command response..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button className="w-full" disabled={!isPremium}>
                <Zap className="w-4 h-4 mr-2" />
                Add Command
              </Button>
              <Button onClick={generateChatCommands} variant="outline" className="w-full">
                Generate Defaults
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Command List */}
        <Card>
          <CardHeader>
            <CardTitle>Active Commands</CardTitle>
          </CardHeader>
          <CardContent>
            {chatCommands.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {chatCommands.map((command, index) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-sm text-purple-600">{command.command}</h4>
                        <p className="text-xs text-muted-foreground">{command.description}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {command.permissions}
                      </Badge>
                    </div>
                    
                    <p className="text-sm bg-background/50 p-2 rounded text-muted-foreground mb-2">
                      {command.response}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{command.cooldown}s cooldown</span>
                      </span>
                      <Button variant="ghost" size="sm" disabled={!isPremium}>
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  No commands configured yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStreamSchedule = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Weekly Schedule</span>
            </span>
            <Button onClick={generateStreamSchedule} variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-1" />
              Generate
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {streamSchedule.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {streamSchedule.map((schedule, index) => (
                <div key={index} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{schedule.day}</h4>
                    <Badge variant="outline" className="text-xs">
                      {schedule.expectedViewers} viewers
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{schedule.startTime} - {schedule.endTime}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Gamepad2 className="w-4 h-4 text-muted-foreground" />
                      <span>{schedule.game}</span>
                    </div>
                    
                    <p className="text-muted-foreground">{schedule.description}</p>
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full mt-3" disabled={!isPremium}>
                    <Settings className="w-3 h-3 mr-1" />
                    Edit Schedule
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Stream Schedule</h3>
              <p className="text-muted-foreground mb-4">
                Create a consistent streaming schedule to build your audience
              </p>
              <Button onClick={generateStreamSchedule}>
                <Calendar className="w-4 h-4 mr-2" />
                Generate Schedule
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderStreamGoals = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Stream Goals</span>
            </span>
            <Button onClick={generateStreamGoals} variant="outline" size="sm">
              <Star className="w-4 h-4 mr-1" />
              Generate
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {streamGoals.length > 0 ? (
            <div className="space-y-4">
              {streamGoals.map((goal, index) => {
                const progress = (goal.current / goal.target) * 100;
                
                return (
                  <div key={index} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {goal.type === 'followers' && <Users className="w-4 h-4" />}
                        {goal.type === 'subscribers' && <Crown className="w-4 h-4" />}
                        {goal.type === 'bits' && <Zap className="w-4 h-4" />}
                        {goal.type === 'donations' && <Gift className="w-4 h-4" />}
                        <h4 className="font-medium capitalize">{goal.type} Goal</h4>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(progress)}%
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{goal.current.toLocaleString()}</span>
                        <span>{goal.target.toLocaleString()}</span>
                      </div>
                      
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Deadline: {goal.deadline}</span>
                        <span>Reward: {goal.reward}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Stream Goals</h3>
              <p className="text-muted-foreground mb-4">
                Set motivating goals to engage your community
              </p>
              <Button onClick={generateStreamGoals}>
                <Star className="w-4 h-4 mr-2" />
                Create Goals
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Feature Navigation */}
      <div className="flex flex-wrap gap-2">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Button
              key={feature.id}
              variant={activeFeature === feature.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFeature(feature.id)}
              className="flex items-center space-x-2"
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{feature.name}</span>
            </Button>
          );
        })}
      </div>

      {/* Feature Content */}
      {activeFeature === 'overlays' && renderOverlayDesigner()}
      {activeFeature === 'commands' && renderChatCommands()}
      {activeFeature === 'schedule' && renderStreamSchedule()}
      {activeFeature === 'goals' && renderStreamGoals()}
      
      {/* Premium Features */}
      {activeFeature === 'analytics' && (
        <PaywallBanner
          feature="Advanced Stream Analytics"
          title="Deep Streaming Insights"
          description="Get detailed analytics on viewer behavior, chat engagement, and growth trends"
          variant="prominent"
        />
      )}
    </div>
  );
}