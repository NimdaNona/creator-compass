'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  Users, 
  Calendar,
  Trophy,
  Search,
  Filter,
  Plus,
  Heart,
  MessageCircle,
  Share2,
  BookOpen,
  Sparkles,
  UserPlus,
  Clock,
  TrendingUp,
  Award
} from 'lucide-react';
import { CommunityPost, PostCategory } from '@/types/community';
import { PostList } from './PostList';
import { CreatePostDialog } from './CreatePostDialog';
import { CommunityStats } from './CommunityStats';
import { TopContributors } from './TopContributors';
import { TrendingTopics } from './TrendingTopics';
import { CollaborationList } from './CollaborationList';
import { EventsList } from './EventsList';
import { ChallengesList } from './ChallengesList';
import { useAppStore } from '@/store/useAppStore';

export function CommunityHub() {
  const [activeTab, setActiveTab] = useState('discussions');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PostCategory | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [collaborations, setCollaborations] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const { selectedPlatform, selectedNiche } = useAppStore();

  useEffect(() => {
    loadCommunityData();
  }, [selectedCategory, searchQuery, activeTab]);

  const loadCommunityData = async () => {
    try {
      setLoading(true);
      
      const promises = [fetch('/api/community/stats')];
      
      // Load data based on active tab
      if (activeTab === 'discussions') {
        const postsParams = new URLSearchParams({
          ...(selectedCategory && { category: selectedCategory }),
          ...(searchQuery && { search: searchQuery }),
          limit: '20'
        });
        promises.push(fetch(`/api/community/posts?${postsParams}`));
      } else if (activeTab === 'collaborations') {
        promises.push(fetch('/api/community/collaborations?limit=20'));
      } else if (activeTab === 'events') {
        promises.push(fetch('/api/community/events?limit=20'));
      } else if (activeTab === 'challenges') {
        promises.push(fetch('/api/community/challenges?limit=20'));
      }
      
      const responses = await Promise.all(promises);
      
      // Always process stats
      if (responses[0].ok) {
        const statsData = await responses[0].json();
        setStats(statsData);
      }
      
      // Process tab-specific data
      if (responses[1] && responses[1].ok) {
        const data = await responses[1].json();
        
        if (activeTab === 'discussions') {
          setPosts(data.posts || []);
        } else if (activeTab === 'collaborations') {
          setCollaborations(data.collaborations || []);
        } else if (activeTab === 'events') {
          setEvents(data.events || []);
        } else if (activeTab === 'challenges') {
          setChallenges(data.challenges || []);
        }
      }
    } catch (error) {
      console.error('Failed to load community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: PostCategory.GENERAL, label: 'General', icon: MessageSquare },
    { id: PostCategory.HELP, label: 'Help & Support', icon: MessageCircle },
    { id: PostCategory.SHOWCASE, label: 'Showcase', icon: Sparkles },
    { id: PostCategory.COLLABORATION, label: 'Collaborations', icon: Users },
    { id: PostCategory.RESOURCES, label: 'Resources', icon: BookOpen },
    { id: PostCategory.TUTORIALS, label: 'Tutorials', icon: Award }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Community Hub</h1>
          <p className="text-muted-foreground mt-1">
            Connect, learn, and grow with fellow creators
          </p>
        </div>
        <Button onClick={() => setCreatePostOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Post
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && <CommunityStats stats={stats} />}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="discussions">
            <MessageSquare className="h-4 w-4 mr-2" />
            Discussions
          </TabsTrigger>
          <TabsTrigger value="collaborations">
            <Users className="h-4 w-4 mr-2" />
            Collaborations
          </TabsTrigger>
          <TabsTrigger value="events">
            <Calendar className="h-4 w-4 mr-2" />
            Events
          </TabsTrigger>
          <TabsTrigger value="challenges">
            <Trophy className="h-4 w-4 mr-2" />
            Challenges
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discussions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Feed */}
            <div className="lg:col-span-2 space-y-4">
              {/* Search and Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search discussions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Category Filters */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Badge
                      variant={!selectedCategory ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setSelectedCategory(null)}
                    >
                      All
                    </Badge>
                    {categories.map((category) => (
                      <Badge
                        key={category.id}
                        variant={selectedCategory === category.id ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        <category.icon className="h-3 w-3 mr-1" />
                        {category.label}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Posts List */}
              <PostList 
                posts={posts}
                loading={loading}
                onRefresh={loadCommunityData}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Trending Topics */}
              <TrendingTopics 
                platform={selectedPlatform?.id}
                niche={selectedNiche?.id}
              />

              {/* Top Contributors */}
              <TopContributors contributors={stats?.topContributors || []} />

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setCreatePostOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Start a Discussion
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('collaborations')}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Find Collaborators
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('events')}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Browse Events
                  </Button>
                </CardContent>
              </Card>

              {/* Community Guidelines */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Community Guidelines</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>✨ Be respectful and supportive</p>
                  <p>🤝 Share knowledge generously</p>
                  <p>🚀 Celebrate others' successes</p>
                  <p>💡 Provide constructive feedback</p>
                  <p>🔒 Respect privacy and boundaries</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="collaborations">
          <CollaborationList 
            collaborations={collaborations}
            loading={loading}
            onRefresh={loadCommunityData}
          />
        </TabsContent>

        <TabsContent value="events">
          <EventsList 
            events={events}
            loading={loading}
            onRefresh={loadCommunityData}
          />
        </TabsContent>

        <TabsContent value="challenges">
          <ChallengesList 
            challenges={challenges}
            loading={loading}
            onRefresh={loadCommunityData}
          />
        </TabsContent>
      </Tabs>

      {/* Create Post Dialog */}
      <CreatePostDialog 
        open={createPostOpen}
        onOpenChange={setCreatePostOpen}
        onSuccess={loadCommunityData}
      />
    </div>
  );
}